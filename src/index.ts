import type { ProcessedStyle, Property } from '@tenoxui/moxie'
import type { Values, Classes, Aliases } from '@tenoxui/types'
import type { Variants, Breakpoints, TenoxUIConfig, Config, ApplyStyleObject } from './types'
import Moxie from '@tenoxui/moxie'
import { merge } from '@nousantx/someutils'

export class AnyCore {
  private main: Moxie
  private prefixLoader: Moxie
  private engine: typeof Moxie
  private variants: Variants
  private customVariants: Property
  private property: Property
  private values: Values
  private classes: Classes
  private alias: Aliases
  private breakpoints: Breakpoints
  private tabSize: number
  private useLayer: boolean
  private tuiConfig: TenoxUIConfig
  private layerOrder: string[]
  private apply: ApplyStyleObject
  private themeConfig: ApplyStyleObject
  private baseConfig: ApplyStyleObject
  private componentsConfig: ApplyStyleObject
  private safelist: string[]
  private layers: Map<string, string>
  private classNamePrefix: string

  constructor({
    tabSize = 2,
    showLayerDirective = false,
    layerOrder = ['theme', 'base', 'components', 'utilities'],
    variants = {},
    customVariants = {},
    shorthand = {},
    valueAlias = {},
    utilityClass = {},
    alias = {},
    breakpoints = {},
    apply = {},
    theme = {},
    base = {},
    components = {},
    safelist = [],
    moxie = Moxie,
    moxieOptions = {},
    classNamePrefix = ''
  }: Partial<Config> = {}) {
    this.tabSize = tabSize
    this.useLayer = showLayerDirective
    this.engine = moxie
    this.variants = variants
    this.customVariants = customVariants
    this.breakpoints = {
      sm: '40rem',
      md: '48rem',
      lg: '64rem',
      xl: '80rem',
      xxl: '96rem',
      ...breakpoints
    }
    this.safelist = safelist
    this.apply = apply
    this.themeConfig = theme
    this.baseConfig = base
    this.componentsConfig = components
    this.classNamePrefix = classNamePrefix
    this.layerOrder = layerOrder
    this.layers = new Map<string, string>([
      ['theme', ''],
      ['base', ''],
      ['components', ''],
      ['utilities', '']
    ])
    this.property = shorthand
    this.classes = utilityClass
    this.alias = alias
    this.values = valueAlias

    this.tuiConfig = {
      ...moxieOptions,
      property: this.property,
      values: this.values,
      classes: this.classes
    }
    this.main = new this.engine(this.tuiConfig)
    this.prefixLoader = new this.engine({
      property: this.customVariants,
      values: this.breakpoints
    })
  }

  /**
   * Utility methods
   */
  public addTabs(str: string, size: number = 2, fixedTabs: boolean = false): string {
    const spaces = ' '.repeat(fixedTabs ? size : this.tabSize)
    return str
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => `${spaces}${line}`)
      .join('\n')
  }

  public createEngine(inputConfig: Partial<TenoxUIConfig> = {}): Moxie {
    return new this.engine(merge(this.tuiConfig, inputConfig))
  }

  public generateRulesFromClass(classNames: string | string[], prefix?: string) {
    if (typeof classNames === 'string' && this.alias[classNames]) {
      return this.main
        .process(this.alias[classNames])
        .map((item) => {
          const { prefix: itemPrefix } = item

          if (prefix && prefix === itemPrefix) return

          return this.generate(item, true)
        })
        .join('\n')
    }

    return this.main
      .process(classNames)
      .map((item) => this.generate(item, true))
      .join('\n')
  }

  public getConfig() {
    return this.tuiConfig
  }

  public getLayerStyle() {
    return {
      base: this.baseConfig,
      theme: this.themeConfig,
      components: this.componentsConfig
    }
  }

  public getAliases(): Aliases {
    return this.alias
  }

  public addAliases(newAliases: Aliases): this {
    this.alias = { ...this.alias, ...newAliases }
    return this
  }

  /**
   * Layer Modifier
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
      this.layerOrder = this.layerOrder.filter((layer) => layer !== layerName)
    }
    return this
  }

  public setLayerOrder(order: string[]): this {
    const existingLayers = Array.from(this.layers.keys())
    const missingLayers = existingLayers.filter((layer) => !order.includes(layer))
    this.layerOrder = [...order, ...missingLayers]
    return this
  }

  /**
   * Prefix Handling Methods
   */

  private getPseudoSyntax(prefix: string): string {
    const doubleColonPrefixes = [
      'after',
      'backdrop',
      'before',
      'cue',
      'cue-region',
      'file-selector-button',
      'first-letter',
      'first-line',
      'grammar-error',
      'marker',
      'part',
      'placeholder',
      'selection',
      'slotted',
      'spelling-error',
      'target-text'
    ]

    return doubleColonPrefixes.includes(prefix) ? '::' : ':'
  }

  private getBreakpointQuery(prefix: string): string | null {
    if (prefix.startsWith('min-')) {
      const breakpointName = prefix.substring(4)
      if (this.breakpoints[breakpointName]) {
        return `@media (width >= ${this.breakpoints[breakpointName]})`
      }
    } else if (prefix.startsWith('max-')) {
      const breakpointName = prefix.substring(4)
      if (this.breakpoints[breakpointName]) {
        return `@media (width < ${this.breakpoints[breakpointName]})`
      }
    } else if (this.breakpoints[prefix]) {
      return `@media (width >= ${this.breakpoints[prefix]})`
    }
    return null
  }

  private isCustomPrefix(prefix: string): boolean {
    const parsed = this.prefixLoader.parse(prefix)
    return Boolean(parsed && parsed[1] && parsed[2])
  }

  private processCustomPrefix(prefix: string): string | string[] | null {
    try {
      const processedItems = this.prefixLoader.process(prefix)
      if (processedItems?.length > 0) {
        return processedItems[0].cssRules
      }
    } catch (error) {
      console.error(`Failed to process prefix ${prefix}:`, error)
    }
    return null
  }

  /**
   * Formats CSS rules from cssRules and value
   */

  private formatRules(cssRules: string | string[] | null, value: string | null): string {
    if (Array.isArray(cssRules) && value !== null) {
      return cssRules
        .map((prop: string) =>
          value
            ? `${this.main.toKebabCase(String(prop))}: ${value}`
            : this.main.toKebabCase(String(prop))
        )
        .join('; ')
    }
    return cssRules as string
  }

  /**
   * Creates the CSS selector string
   */

  private createSelector(
    className: string,
    prefix: string | null | undefined,
    custom?: boolean
  ): string {
    const selectorPrefix = custom ? '' : '.'
    const escapedClassName = this.main.escapeCSSSelector(
      prefix ? `${prefix}:${className}` : className
    )
    return `${selectorPrefix}${escapedClassName}`
  }

  /**
   * Generates the CSS wrapper based on prefix type
   */

  private generateCSSWrapper(
    prefix: string,
    rules: string,
    finalValue: string,
    indent: number = 0
  ): string {
    const prefixData = this.generatePrefix(prefix)

    if (prefixData.isMedia || prefixData.isBreakpoint) {
      return `${prefixData.prefix} {\n${this.formatMediaContent(
        rules,
        finalValue,
        prefixData.isBreakpoint
      )}\n}`
    }

    return `${prefixData.prefix} { ${rules}${finalValue} }`
  }

  private generatePrefix(prefix: string): {
    prefix: string
    isMedia: boolean
    isBreakpoint: boolean
  } {
    // Handle custom prefixes
    if (this.isCustomPrefix(prefix)) {
      const moxieRule = this.processCustomPrefix(prefix)
      if (moxieRule && typeof moxieRule === 'string') {
        if (moxieRule.startsWith('value:')) {
          const actualRule = moxieRule.substring(6)
          if (actualRule.startsWith('@media')) {
            return { prefix: actualRule, isMedia: true, isBreakpoint: false }
          }
          return { prefix: actualRule, isMedia: false, isBreakpoint: false }
        }
        return { prefix: moxieRule, isMedia: false, isBreakpoint: false }
      }
    }

    // Handle direct prefix
    if (
      (prefix.startsWith('[') && prefix.endsWith(']')) ||
      (prefix.startsWith('(') && prefix.endsWith(')'))
    ) {
      return {
        prefix: this.prefixLoader.processValue(prefix, '', ''),
        isMedia: false,
        isBreakpoint: false
      }
    }

    // Handle breakpoints
    const breakpointQuery = this.getBreakpointQuery(prefix)
    if (breakpointQuery) {
      return { prefix: breakpointQuery, isMedia: false, isBreakpoint: true }
    }

    // Handle variants
    if (this.variants[prefix]) {
      return {
        prefix: this.variants[prefix],
        isMedia: false,
        isBreakpoint: true
      }
    }

    // Handle pseudo-elements/classes
    const pseudoSyntax = this.getPseudoSyntax(prefix)
    return {
      prefix: `&${pseudoSyntax}${prefix}`,
      isMedia: false,
      isBreakpoint: false
    }
  }

  private formatMediaContent(rules: string, finalValue: string, isBreakpoint: boolean): string {
    if (isBreakpoint) {
      return this.addTabs(rules + finalValue, this.tabSize, true)
    }
    return rules + finalValue
  }

  /**
   * Main Generator
   */

  private processApplyObject(obj: ApplyStyleObject, indentLevel: number = 0): string {
    let css = ''

    if (obj.SINGLE_RULE) {
      css += obj.SINGLE_RULE.join('\n') + '\n'
      delete obj.SINGLE_RULE
    }

    for (const key in obj) {
      const value = obj[key]
      css += key
        ? `${this.addTabs(
            key
              .split(',')
              .map((name) => this.classNamePrefix + name.trim())
              .join(', '),
            this.tabSize * indentLevel,
            true
          )} {\n`
        : ''

      if (typeof value === 'string') {
        const rules = this.generateRulesFromClass(value)
        css += `${this.addTabs(rules, this.tabSize * (key ? indentLevel + 1 : indentLevel), true)}`
        if (rules.length) css += '\n'
      } else if (typeof value === 'object') {
        css += this.processApplyObject(value, indentLevel + 1)
      }

      css += key ? `${this.addTabs('}', this.tabSize * indentLevel, true)}\n` : ''
    }

    return css
  }

  public generate(item: ProcessedStyle, rulesOnly?: boolean, custom?: boolean): string {
    const { className, cssRules, value, prefix } = item
    const selector = this.createSelector(className, prefix, custom)
    const rules = this.formatRules(cssRules, value)
    const finalValue = Array.isArray(cssRules) || value === null ? '' : `: ${value}`

    if (!prefix) {
      return rulesOnly
        ? rules + finalValue + ';'
        : `${this.classNamePrefix}${selector} {\n${this.addTabs(
            rules + finalValue,
            this.tabSize
          )}\n}`
    }

    const cssWrapper = this.generateCSSWrapper(prefix, rules, finalValue)
    return rulesOnly
      ? cssWrapper
      : `${this.classNamePrefix}${selector} {\n${this.addTabs(cssWrapper, this.tabSize)}\n}`
  }

  public addStyle(layer: string = 'base', config: ApplyStyleObject = {}): this {
    if (!this.layers.has(layer)) {
      this.addLayer(layer)
    }

    const ui = this.processApplyObject(config)
    const currentStyles = this.layers.get(layer) || ''

    this.layers.set(layer, currentStyles + ui)

    return this
  }

  public createStyles(finalUtilities: string = ''): string {
    const existingLayers = Array.from(this.layers.keys())
    const orderedLayers = this.layerOrder.filter((layer) => existingLayers.includes(layer))

    let styles = this.useLayer ? `@layer ${orderedLayers.join(', ')};\n` : ''

    orderedLayers.forEach((layer) => {
      if (
        (this as any)[`${layer}Config`] &&
        Object.entries((this as any)[`${layer}Config`]).length > 0
      )
        this.addStyle(layer, (this as any)[`${layer}Config`])

      let layerStyles = this.layers.get(layer) || ''

      if (layer === 'utilities' && finalUtilities.trim()) {
        layerStyles +=
          layerStyles !== '' ? '\n' : '' + this.processApplyObject(this.apply) + `${finalUtilities}`
      }

      if (layerStyles.trim()) {
        styles += this.useLayer
          ? `@layer ${layer} {\n${this.addTabs(layerStyles)}\n}\n`
          : layerStyles
      }
    })

    return styles
  }

  public process(classNames: string | string[]):
    | Partial<{
        className: string
        cssRules: string | string[] | null
        value: string | null
        variants: null | { name: string; data: string }
        raw: null | (string | undefined)[]
      }>[]
    | null {
    const classes = classNames
      ? Array.isArray(classNames)
        ? classNames
        : classNames.split(/\s+/).filter(Boolean)
      : []

    if (!classes || 1 > classes.length) return null

    const data = this.main.process(classes).map((item) => {
      const { className, cssRules, value, prefix, raw } = item

      return {
        className: raw ? raw[6] : className,
        cssRules,
        value,
        variants: prefix ? { name: prefix, data: this.generatePrefix(prefix).prefix } : null,
        raw
      }
    })

    return data
  }

  public render(classNames?: string | string[]): string {
    const classes = [
      ...this.safelist,
      ...(classNames
        ? Array.isArray(classNames)
          ? classNames
          : classNames.split(/\s+/).filter(Boolean)
        : [])
    ]

    if (!classes) return this.createStyles()

    const storedRules: string[] = []

    classes.forEach((className) => {
      const parsed = this.main.parse(className, Object.keys(this.alias))

      if (parsed) {
        const [prefix, type] = parsed

        if (type && this.alias[type]) {
          const rules = this.generateRulesFromClass(type, prefix)
          let finalRules: string

          if (prefix) {
            const processedPrefix = this.generatePrefix(prefix)
            finalRules = `${processedPrefix.prefix} {\n${this.addTabs(rules, this.tabSize)}\n}`
          } else finalRules = rules

          storedRules.push(
            `${this.classNamePrefix}.${this.main.escapeCSSSelector(className)} {\n${this.addTabs(
              finalRules
            )}\n}\n`
          )
          return
        }
      }

      const processedStyles = this.main
        .process(className)
        .map((item) => this.generate(item))
        .join('\n')

      if (processedStyles) {
        storedRules.push(processedStyles + '\n')
      }
    })

    return this.createStyles(storedRules.join(''))
  }
}

export { is, merge, transformClasses as createUtilityStyle } from '@nousantx/someutils'
export { TenoxUI as Moxie } from '@tenoxui/moxie'
export * from './types'
export default AnyCore
