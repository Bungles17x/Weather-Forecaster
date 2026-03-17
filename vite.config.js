import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  base: '/Weather-Forecaster/docs/',
  build: {
    outDir: 'docs',
    assetsDir: 'assets'
  },
  server: {
    port: 5173,
    host: true
  }
})
