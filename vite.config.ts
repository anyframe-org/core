import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2017',
    lib: {
      name: '__anyframe_core__',
      entry: './src/index.ts',
      formats: ['es', 'iife', 'cjs', 'umd'],
      fileName: (format) => `index.${format}${format !== 'cjs' ? '.js' : ''}`
    },
    sourcemap: true,
    rollupOptions: {
      external: ['@tenoxui/static'],
      output: {
        globals: {
          '@tenoxui/static': '__tenoxui_static__'
        },
        exports: 'named'
      }
    }
  }
})
