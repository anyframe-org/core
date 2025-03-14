import { Config, TenoxUIConfig, type StyleValue } from './types'
import { TenoxUI } from '@tenoxui/static'
import { merge } from '@nousantx/someutils'

export class AnyFrame {
  private config: Pick<TenoxUIConfig, 'property' | 'values' | 'classes' | 'aliases' | 'breakpoints'>
  private reserveClass: string[]
  private apply: Record<string, StyleValue>
  private tabSize: number
  private useLayer: boolean
  private layerOrder: string[]
  private themeConfig: TenoxUIConfig
  private baseConfig: TenoxUIConfig
  private componentsConfig: TenoxUIConfig
  private layers: Map<string, string>
  constructor({
    property = {},
    values = {},
    classes = {},
    aliases = {},
    breakpoints = [],
    apply = {},
    reserveClass = [],
    tabSize = 2,
    showLayerModifier = false,
    layerOrder = ['theme', 'base', 'components', 'utilities'],
    theme = {},
    base = {},
    components = {}
  }: Config = {}) {
    this.config = { property, values, classes, aliases, breakpoints }
    this.reserveClass = reserveClass
    this.apply = apply
    this.tabSize = tabSize
    this.useLayer = showLayerModifier
    this.layerOrder = layerOrder
    this.themeConfig = theme
    this.baseConfig = base
    this.componentsConfig = components

    this.layers = new Map<string, string>([
      ['theme', ''],
      ['base', ''],
      ['components', ''],
      ['utilities', '']
    ])
  }

  /**
   * Utilities
   * Basic utility functions to aid development
   */
  private addTabs(str: string, size: number = 2, fixedTabs: boolean = false): string {
    return str
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => `${' '.repeat(fixedTabs ? size : this.tabSize)}${line}`)
      .join('\n')
  }

  private createTenoxUI(inputConfig: Partial<Config> = {}): TenoxUI {
    return new TenoxUI(merge(this.config, inputConfig))
  }

  public getConfig() {
    return this.config
  }

  public getLayerConfig() {
    return {
      base: this.baseConfig,
      theme: this.themeConfig,
      components: this.componentsConfig
    }
  }

  /**
   * Layers
   * Methods for managing CSS layers for better style output organization
   */
  public addLayer(layerName: string): this {
    if (!this.layers.has(layerName)) {
      this.layers.set(layerName, '')
      if (!this.layerOrder.includes(layerName)) {
        this.layerOrder.push(layerName)
      }
    }
    return this
  }

  public removeLayer(layerName: string): this {
    if (layerName !== 'base' && layerName !== 'theme') {
      this.layers.delete(layerName)
      this.layerOrder = this.layerOrder.filter(layer => layer !== layerName)
    }
    return this
  }

  public setLayerOrder(order: string[]): this {
    const existingLayers = Array.from(this.layers.keys())
    const missingLayers = existingLayers.filter(layer => !order.includes(layer))
    this.layerOrder = [...order, ...missingLayers]
    return this
  }

  /**
   * Main Styles Computation
   */
  public addStyle(layer: string = 'base', config: Partial<Config> = {}): this {
    if (!this.layers.has(layer)) {
      this.addLayer(layer)
    }

    const ui = this.createTenoxUI(config).generate()
    const currentStyles = this.layers.get(layer) || ''

    this.layers.set(layer, currentStyles + ui)

    return this
  }

  public createStyles(finalUtilities: string = ''): string {
    const existingLayers = Array.from(this.layers.keys())
    const orderedLayers = this.layerOrder.filter(layer => existingLayers.includes(layer))

    // If layering is enabled, wrap the layers declaration
    let styles = this.useLayer ? `@layer ${orderedLayers.join(', ')};\n` : ''

    orderedLayers.forEach(layer => {
      // If the layer's configuration is not empty, generate its styles
      if (
        (this as any)[`${layer}Config`] &&
        Object.entries((this as any)[`${layer}Config`]).length > 0
      )
        this.addStyle(layer, (this as any)[`${layer}Config`])

      let layerStyles = this.layers.get(layer) || ''

      if (layer === 'utilities' && finalUtilities.trim()) {
        layerStyles += layerStyles !== '' ? '\n' : '' + `${finalUtilities}`
      }

      if (layerStyles.trim()) {
        styles += this.useLayer
          ? `@layer ${layer} {\n${this.addTabs(layerStyles)}\n}\n`
          : layerStyles
      }
    })

    return styles
  }

  public create(classNames: string[]) {
    const ui = new TenoxUI({
      ...this.config,
      apply: this.apply,
      reserveClass: this.reserveClass
    })

    if (classNames) ui.processClassNames(classNames)

    const stylesheet = this.createStyles(ui.generate())
    return stylesheet.replace(/\n$/, '')
  }
}

export function defineConfig(config: Config): Config {
  return config
}

export * from './types'
export { TenoxUI } from '@tenoxui/static'
export default { TenoxUI, AnyFrame, defineConfig }
