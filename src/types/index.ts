import type { Property, Values, Aliases, Classes, Breakpoint } from '@tenoxui/types'
type NestedStyles = {
  [selector: string]: StyleValue
}
export type StyleValue = string | NestedStyles
export interface TenoxUIConfig {
  property?: Property
  values?: Values
  classes?: Classes
  aliases?: Aliases
  breakpoints?: Breakpoint[]
  reserveClass?: string[]
  apply?: Record<string, StyleValue>
}

export interface Config extends TenoxUIConfig {
  tabSize?: number
  showLayerModifier?: boolean
  layerOrder?: string[]
  theme?: Partial<TenoxUIConfig>
  base?: Partial<TenoxUIConfig>
  components?: Partial<TenoxUIConfig>
}
