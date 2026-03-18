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
    },
    sourcemap: false,
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true
      }
    }
  },
  server: {
    port: 5173,
    host: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.DEV': JSON.stringify(false),
    'import.meta.env.PROD': JSON.stringify(true),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env.BASE_URL': JSON.stringify('/Weather-Forecaster/'),
    'import.meta.env.SSR': JSON.stringify(false),
    '__DEFINES__': JSON.stringify({}),
    '__DEV__': JSON.stringify(false),
    '__PROD__': JSON.stringify(true),
    '__TEST__': JSON.stringify(false),
    '__BROWSER__': JSON.stringify(true),
    '__BASE__': JSON.stringify('/Weather-Forecaster/')
  },
  optimizeDeps: {
    exclude: ['react-devtools', 'react-dom/devtools'] // Exclude development dependencies
  }
})
