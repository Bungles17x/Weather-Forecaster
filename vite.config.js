import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  base: '/Weather-Forecaster/', // GitHub Pages repository name
  build: {
    outDir: 'docs',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    host: true
  },
  define: {
    __DEFINES__: JSON.stringify({}),
    __HMR_CONFIG_NAME__: JSON.stringify(''),
    __DEV__: JSON.stringify(false)
  }
})
