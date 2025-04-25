import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  build: {
    target: 'es2017',
    lib: {
      name: '__anyframe_core__',
      entry: './src/index.ts',
      formats: ['es', 'iife', 'cjs', 'umd'],
      fileName: (format) => `index.${format !== 'cjs' ? `${format}.js` : format}`
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  }
})
