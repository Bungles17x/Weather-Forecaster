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
    }
  },
  assetsInclude: ['**/*.jsx'],
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && req.url.endsWith('.jsx')) {
        res.setHeader('Content-Type', 'application/javascript')
      }
      next()
    })
  }
})
