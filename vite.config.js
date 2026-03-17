import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  base: './',
  build: {
    outDir: 'docs',
    assetsDir: 'assets'
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: false
    },
    headers: {
      'Content-Type': 'application/javascript'
    }
  },
  // Prevent service worker registration
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
})
