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
    headers: {
      // Fix MIME type for @react-refresh and other modules
      'Content-Type': 'application/javascript',
      // Add proper MIME types for different file extensions
      '.js': 'application/javascript',
      '.jsx': 'application/javascript',
      '.ts': 'application/typescript',
      '.tsx': 'application/typescript'
    }
  },
  // Ensure proper module resolution
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
})
