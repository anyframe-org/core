import { describe, it, expect, beforeEach, afterEach } from 'saintest'
import { AnyFrame } from '../dist/index.es.js'

describe('AnyFrame', () => {
  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const ui = new AnyFrame({})
      expect(ui.getConfig()).toEqual({
        property: {},
        values: {},
        classes: {},
        aliases: {},
        breakpoints: []
      })
    })

    it('should initialize with custom configuration', () => {
      const ui = new AnyFrame({
        property: { bg: 'background' },
        values: { red: '#ff0000' },
        showLayerModifier: true
      })
      expect(ui.getConfig().property).toEqual({ bg: 'background' })
      expect(ui.getConfig().values).toEqual({ red: '#ff0000' })
    })
  })

  // Test layer management
  describe('Layer Management', () => {
    let ui

    beforeEach(() => {
      ui = new AnyFrame({
        property: { bg: 'background' },
        showLayerModifier: true
      })
    })

    it('should add a new layer', () => {
      ui.addLayer('custom')
      const layerConfig = ui.getLayerConfig()
      expect(Object.keys(layerConfig)).toContain('base')
      expect(ui.layerOrder).toContain('custom')
    })

    it('should remove a layer', () => {
      ui.removeLayer('components')

      expect(ui.layerOrder).not.toContain('components')
      expect(ui.layerOrder[2]).toBe('utilities')
    })

    it('should not remove base or theme layers', () => {
      ui.removeLayer('base')
      ui.removeLayer('theme')
      const layerConfig = ui.getLayerConfig()
      expect(Object.keys(layerConfig)).toContain('base')
      expect(Object.keys(layerConfig)).toContain('theme')
    })

    it('should set layer order correctly', () => {
      ui.setLayerOrder(['theme', 'base', 'utilities', 'components'])
      expect(ui.layerOrder).toEqual(['theme', 'base', 'utilities', 'components'])
    })
  })

  describe('Style Generation', () => {
    let ui

    beforeEach(() => {
      ui = new AnyFrame({
        property: {
          bg: 'background'
        },
        values: {
          red: '#ff0000',
          blue: '#0000ff',
          primary: '#ccf654'
        },
        showLayerModifier: true
      })
    })

    afterEach(() => {
      ui = null
    })

    it('should parse style correctly', () => {
      expect(ui.create(['bg-primary'])).toContain('.bg-primary { background: #ccf654 }')
    })

    it('should generate styles with layer modifier', () => {
      ui.addStyle('base', {
        apply: {
          body: 'bg-blue'
        }
      })
      const styles = ui.create(['bg-red'])
      expect(styles).toContain('@layer theme, base, components, utilities;')
      expect(styles).toContain('  body {\n    background: #0000ff\n  }')
    })

    it('should generate styles without layer modifier', () => {
      const uiNoLayer = new AnyFrame({
        property: { bg: 'background' },
        values: { red: 'blue' },
        showLayerModifier: false
      })
      uiNoLayer.addStyle('base', {
        apply: {
          body: 'bg-red'
        }
      })
      const styles = uiNoLayer.create([])
      expect(styles).not.toContain('@layer')
      expect(styles).toContain('body {\n  background: blue\n}')
    })

    it('should handle multiple layers with correct order', () => {
      ui.addStyle('base', {
        apply: { body: 'bg-blue' }
      })
      ui.addStyle('utilities', {
        apply: { '.custom': 'bg-red' }
      })
      const styles = ui.create([])

      const baseIndex = styles.indexOf('@layer base')
      const utilitiesIndex = styles.indexOf('@layer utilities')
      expect(baseIndex).toBeLessThan(utilitiesIndex)
    })

    it('should merge utility classes with predefined styles', () => {
      ui.addStyle('base', {
        apply: { body: 'bg-blue' }
      })
      const styles = ui.create(['bg-red'])
      expect(styles).toContain(`  body {
    background: #0000ff
  }`)
      expect(styles).toContain('.bg-red { background: #ff0000 }')
    })
  })

  describe('Utilities', () => {
    let ui

    beforeEach(() => {
      ui = new AnyFrame({
        tabSize: 4
      })
    })

    it('should add tabs correctly', () => {
      const input = 'test\nline'
      const result = ui.addTabs(input)
      expect(result).toContain('    test\n    line')
    })

    it('should handle fixed tab size', () => {
      const input = 'test\nline'
      const result = ui.addTabs(input, 2, true)
      expect(result).toContain('  test\n  line')
    })
  })
})
