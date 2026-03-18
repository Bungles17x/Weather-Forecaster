import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  base: './',
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
    __DEFINES__: JSON.stringify({})
  }
})
