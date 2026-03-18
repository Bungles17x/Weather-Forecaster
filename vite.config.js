import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  base: './', // Use relative paths for GitHub Pages
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
    __DEV__: JSON.stringify(false),
    __BASE__: JSON.stringify('./'),
    __HMR_BASE__: JSON.stringify('./'),
    __SERVER_HOST__: JSON.stringify(''),
    __HMR_PROTOCOL__: JSON.stringify(''),
    __HMR_PORT__: JSON.stringify(''),
    __HMR_HOSTNAME__: JSON.stringify(''),
    __HMR_DIRECT_TARGET__: JSON.stringify(false),
    __WS_TOKEN__: JSON.stringify(''),
    'import.meta.env.BASE_URL': JSON.stringify('./'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env.PROD': JSON.stringify(true),
    'import.meta.env.DEV': JSON.stringify(false)
  }
})
