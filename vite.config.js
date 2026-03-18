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
    __HMR_ENABLE_OVERLAY__: JSON.stringify(false),
    __HMR_TIMEOUT__: JSON.stringify(30000),
    __HMR_RELOAD_DELAY__: JSON.stringify(0),
    __HMR_MAX_RETRIES__: JSON.stringify(0),
    __HMR_CLEAR_CONSOLE__: JSON.stringify(false),
    __HMR_CLIENT__: JSON.stringify({}),
    __HMR_WS__: JSON.stringify(false),
    __HMR_BROWSER__: JSON.stringify(false),
    __HMR_RUNTIME__: JSON.stringify(false),
    __HMR_DEAD_TIMEOUT__: JSON.stringify(30000),
    __HMR_HEADER__: JSON.stringify({}),
    __HMR_CLIENT_RECONNECT__: JSON.stringify(false),
    'import.meta.env.BASE_URL': JSON.stringify('./'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env.PROD': JSON.stringify(true),
    'import.meta.env.DEV': JSON.stringify(false)
  }
})
