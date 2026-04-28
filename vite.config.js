import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'
import babel from '@rollup/plugin-babel'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: [
      '@math.gl/core',
      '@math.gl/geospatial',
      '@math.gl/web-mercator',
      '@math.gl/polygon',
      '@math.gl/culling',
      '@loaders.gl/core',
      '@loaders.gl/las',
      '@deck.gl/core',
      '@deck.gl/layers',
      '@deck.gl/mapbox',
      '@luma.gl/core',
      '@luma.gl/constants',
      '@luma.gl/webgl',
      '@luma.gl/shadertools',
      '@luma.gl/engine',
      '@luma.gl/gltf',
      '@probe.gl/env'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    rollupOptions: {
      plugins: [
        babel({
          babelHelpers: 'runtime',
          exclude: /node_modules\/(?!(@math\.gl|@loaders\.gl|@deck\.gl|@luma\.gl|@probe\.gl)\/)/,
          presets: [
            ['@babel/preset-env', {
              targets: {
                browsers: ['> 1%', 'last 2 versions', 'not ie <= 11']
              }
            }]
          ],
          plugins: ['@babel/plugin-transform-runtime']
        })
      ]
    }
  }
})
