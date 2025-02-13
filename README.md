# AnyFrame/core

`anyframe/core` is a lightweight TenoxUI static css builder with layering features and easy to use.

## Installation

```bash
npm i @anyframe/core
```

## Imports

```javascript
// esm
import { AnyFrame, defineConfig } from '@anyframe/core'

// cjs
const { AnyFrame, defineConfig } = require('@anyframe/core')

// umd/browser
const { AnyFrame, defineConfig } = __anyframe_core__
```

## Configuration Options

```javascript
const ui = new AnyFrame({
  tabSize: 2,
  showLayerModifier: false,
  layerOrder: ['theme', 'base', 'components', 'utilities'],
  // main tenoxui configuration, applied for all layers
  // see: https://github.com/tenoxui/tenoxui/tree/main/packages/%40tenoxui-static
  property: {},
  values: {},
  classes: {},
  aliases: {},
  breakpoints: [],
  apply: {},
  reserveClass: [],
  // custom tenoxui configuration for different layers
  base: {},
  theme: {},
  components: {}
})
```

- `tabSize` - How many spaces for nested rules (default: `2`)
- `showLayerModifier` - Option to show `@layer` modifier (default: `false`)
- `layerOrder` - Set layer order
- `base` - Set custom tenoxui config for `base` layer
- `theme` - Set custom tenoxui config for `theme` layer
- `components` - Set custom tenoxui config for `utilities` layer
- `utilities` - Set custom tenoxui config for `components` layer

Note: You can checkout [TenoxUI Static Repository](https://github.com/tenoxui/tenoxui/tree/main/packages/%40tenoxui-static) for `property` `values`, `classes`, `breakpoints`, `aliases`, `reserveClass`, and `apply` options.

## API

### `addLayer`, `removeLayer`, `setLayerOrder`

```typescript
addLayer(layer: string) {}
removeLayer(layer: string) {}
setLayerOrder(layers: string[]) {}
```

As its name, you can add, remove layer, and set new layer order. Example :

```javascript
const ui = new AnyFrame()
console.log(ui.layerOrder) // => theme, base, components, utilities

ui.addLayer('custom').addLayer('remove-later')
console.log(ui.layerOrder) // => theme, base, components, utilities, custom, remove-later

//! Note that you can't remove 4 main layers; base theme, components, and utilities
ui.removeLayer('remove-later')
console.log(ui.layerOrder) // => theme, base, components, utilities, custom

ui.setLayerOrder(['utilities', 'theme', 'custom', 'components', 'base'])
console.log(ui.layerOrder) // => utilities, theme, custom, components, base
```

### `AnyFrame.addStyle`

```typescript
addStyle(layer: string, config: TenoxUIConfig) {}
```

Method to add custom config for exact layer. Example :

```javascript
const ui = new AnyFrame({
  /* global config, accessible for all layers */
  property: {
    m: 'margin'
  }
})

ui.addStyle('base', {
  /* only available for 'base' layer */
  property: {
    p: 'padding'
  },
  apply: {
    '*': 'm-0 p-0 [box-sizing]-border-box'
  }
})

console.log(ui.layers.get('base'))
```

### `AnyFrame.create`

Method that return the all styles, from every layers. Example :

```javascript
const ui = new AnyFrame({
  showLayerModifier: true,
  property: {
    bg: 'background',
    m: 'margin',
    p: 'padding'
  },
  base: {
    apply: {
      '*, *::before, *::after': 'm-0 p-0 [box-sizing]-border-box'
    }
  }
})

console.log(ui.create(['bg-red', 'm-10px', '[m,p]-2rem', 'bg-[rgb(0_255_0)]']))
```

Output:

```
@layer theme, base, components, utilities;
@layer base {
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box }
}
@layer utilities {
  .bg-red { background: red }
  .m-10px { margin: 10px }
  .\[m\,p\]-2rem { margin: 2rem; padding: 2rem }
  .bg-\[rgb\(0_255_0\)\] { background: rgb(0 255 0) }
}
```

## License

MIT
