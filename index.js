const { AnyCore, is } = require('./dist/index.cjs')

const css = new AnyCore({
  tabSize: 4,
  shorthand: {
    bg: ({ value, unit, secondValue }) => {
      if (secondValue) return null

      if (is.color.test(value)) {
        return `value:background-color: ${value + unit}`
      } else if (['clip', 'fixed'].includes(value)) {
        return `value:background-clip: ${value + unit}`
      }

      return `value:background: ${value + unit}`
    }
  },
  variants: {},
  customVariants: {
    theme: ({ value }) => `[data-theme=${value}] &`
  }
})

console.log(css.render('bg-red theme-light:bg-#ff544a hover:bg-blue'))
