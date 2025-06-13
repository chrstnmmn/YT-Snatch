import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['@electron-toolkit/utils']
      })
    ],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          index: resolve('src/main/index.js')
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
          preserveModules: false
        }
      }
    }
  },
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        output: {
          format: 'cjs',
          entryFileNames: '[name].js'
        }
      }
    },
    plugins: [
      externalizeDepsPlugin({
        exclude: ['@electron-toolkit/preload'] // Critical change
      })
    ]
  },
  renderer: {
    build: {
      outDir: 'out/renderer',
      emptyOutDir: true,
      assetsDir: '.', // Fixes asset paths
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name][extname]' // Organizes assets
        }
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@assets': resolve('src/renderer/src/assets') // New alias for assets
      }
    },
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()]
      }
    }
  }
})
