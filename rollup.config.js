import { readFileSync } from 'node:fs'
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

const sourcemap = true
const fileName = 'index'
const name = '__anyframe_core__'
const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * Licensed under the ${pkg.license} License
 */`

export default {
  input: 'src/index.ts',
  output: [
    {
      file: `dist/${fileName}.cjs`,
      format: 'cjs',
      exports: 'named',
      sourcemap,
      name,
      banner
    },
    {
      file: `dist/${fileName}.min.cjs`,
      format: 'cjs',
      exports: 'named',
      sourcemap,
      name,
      plugins: [
        terser({
          format: {
            comments: false,
            preamble: banner
          },
          mangle: false,
          mangle: true,
          compress: {
            defaults: true,
            passes: 2
          }
        })
      ]
    },
    {
      file: `dist/${fileName}.umd.js`,
      format: 'umd',
      exports: 'named',
      sourcemap,
      name,
      banner
    },
    {
      file: `dist/${fileName}.umd.min.js`,
      format: 'umd',
      exports: 'named',
      sourcemap,
      name,
      plugins: [
        terser({
          format: {
            comments: false,
            preamble: banner
          },
          mangle: false,
          mangle: true,
          compress: {
            defaults: true,
            passes: 2
          }
        })
      ]
    },
    {
      file: `dist/${fileName}.esm.js`,
      format: 'es',
      banner,
      sourcemap
    },
    {
      file: `dist/${fileName}.esm.min.js`,
      sourcemap,
      format: 'es',
      plugins: [
        terser({
          format: {
            comments: false,
            preamble: banner
          },
          mangle: true,
          compress: {
            defaults: true,
            passes: 2
          }
        })
      ]
    }
  ],
  plugins: [typescript(), resolve(), commonjs()]
}
