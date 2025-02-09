import { Config, TenoxUIConfig } from './types'
import { TenoxUI } from '@tenoxui/static'
import { merge } from '@nousantx/someutils'

export class AnyFrame {
  private mainConfig: TenoxUIConfig
  private config: Pick<TenoxUIConfig, 'property' | 'values' | 'classes' | 'aliases' | 'breakpoints'>
  private tabSize: number
  private useLayer: boolean
  private layerOrder: string[]
  private baseConfig: TenoxUIConfig
  private themeConfig: TenoxUIConfig
  private componentsConfig: TenoxUIConfig
  private utilitiesConfig: TenoxUIConfig
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
    layerOrder = ['base', 'theme', 'components', 'utilities'],
    base = {},
    theme = {},
    components = {},
    utilities = {}
  }: Config) {
    this.mainConfig = { property, values, classes, aliases, breakpoints, apply, reserveClass }
    this.config = { property, values, classes, aliases, breakpoints }
    this.tabSize = tabSize
    this.useLayer = showLayerModifier
    this.layerOrder = layerOrder
    this.baseConfig = base
    this.themeConfig = theme
    this.componentsConfig = components
    this.utilitiesConfig = utilities

    this.layers = new Map<string, string>([
      ['base', ''],
      ['theme', ''],
      ['components', ''],
      ['utilities', '']
    ])
  }

  /**
   * Utilities
   * Basic utility functions to aid development
   */
  addTabs(str: string, size: number = 2, fixedTabs: boolean = false): string {
    return str
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => `${' '.repeat(fixedTabs ? size : this.tabSize)}${line}`)
      .join('\n')
  }

  createTenoxUI(inputConfig: Partial<Config> = {}): TenoxUI {
    return new TenoxUI(merge(this.config, inputConfig))
  }

  getConfig() {
    return this.config
  }

  getLayerConfig() {
    return {
      base: this.baseConfig,
      theme: this.themeConfig,
      components: this.componentsConfig,
      utilities: this.utilitiesConfig
    }
  }

  /**
   * Layers
   * Methods for managing CSS layers for better style output organization
   */
  addLayer(layerName: string): this {
    if (!this.layers.has(layerName)) {
      this.layers.set(layerName, '')
      if (!this.layerOrder.includes(layerName)) {
        this.layerOrder.push(layerName)
      }
    }
    return this
  }

  removeLayer(layerName: string): this {
    if (layerName !== 'base' && layerName !== 'theme') {
      this.layers.delete(layerName)
      this.layerOrder = this.layerOrder.filter((layer) => layer !== layerName)
    }
    return this
  }

  setLayerOrder(order: string[]): this {
    const existingLayers = Array.from(this.layers.keys())
    const missingLayers = existingLayers.filter((layer) => !order.includes(layer))
    this.layerOrder = [...order, ...missingLayers]
    return this
  }

  /**
   * Main Styles Computation
   */
  addStyle(layer: string = 'base', config: Partial<Config> = {}): this {
    if (!this.layers.has(layer)) {
      this.addLayer(layer)
    }

    const ui = this.createTenoxUI(config).generateStylesheet()
    const currentStyles = this.layers.get(layer) || ''

    this.layers.set(layer, currentStyles + ui)

    return this
  }

  createStyles(finalUtilities: string = ''): string {
    const existingLayers = Array.from(this.layers.keys())
    const orderedLayers = this.layerOrder.filter((layer) => existingLayers.includes(layer))

    // If layering is enabled, wrap the layers declaration
    let styles = this.useLayer ? `@layer ${orderedLayers.join(', ')};\n` : ''

    orderedLayers.forEach((layer) => {
      // If the layer's configuration is not empty, generate its styles
      if (Object.entries((this as any)[`${layer}Config`]).length > 0)
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

  create(classNames: string[]) {
    const ui = new TenoxUI(this.mainConfig).processClassNames(classNames)
    const stylesheet = this.createStyles(ui.generateStylesheet())

    return stylesheet
  }
}

export function defineConfig(config: Config): Config {
  return config
}

export * from './types'
export default { AnyFrame, defineConfig }
