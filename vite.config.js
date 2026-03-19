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
      },
      external: ['@vite/client']
    },
    sourcemap: false,
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error'] // Remove specific console calls
      },
      mangle: {
        reserved: ['React', 'useState', 'useEffect'] // Preserve React hooks
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false // Disable HMR overlay in production
    }
  },
  define: {
    // Environment variables
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.DEV': JSON.stringify(false),
    'import.meta.env.PROD': JSON.stringify(true),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env.BASE_URL': JSON.stringify('/Weather-Forecaster/'),
    'import.meta.env.SSR': JSON.stringify(false),
    
    // Vite internal variables - comprehensive coverage
    '__DEFINES__': JSON.stringify({}),
    '__DEV__': JSON.stringify(false),
    '__PROD__': JSON.stringify(true),
    '__TEST__': JSON.stringify(false),
    '__BROWSER__': JSON.stringify(true),
    '__BASE__': JSON.stringify('/Weather-Forecaster/'),
    '__WS_TOKEN__': JSON.stringify(''),
    '__HMR_CONFIG_NAME__': JSON.stringify(''),
    '__HMR_ENABLE_OVERLAY__': JSON.stringify(false),
    '__HMR_TIMEOUT__': JSON.stringify(30000),
    '__HMR_RELOAD_DELAY__': JSON.stringify(0),
    '__HMR_MAX_RETRIES__': JSON.stringify(0),
    '__HMR_CLEAR_CONSOLE__': JSON.stringify(false),
    '__HMR_CLIENT__': JSON.stringify(false),
    '__HMR_WS__': JSON.stringify(false),
    '__HMR_BROWSER__': JSON.stringify(false),
    '__HMR_RUNTIME__': JSON.stringify(false),
    '__HMR_DEAD_TIMEOUT__': JSON.stringify(30000),
    '__HMR_HEADER__': JSON.stringify({}),
    '__HMR_CLIENT_RECONNECT__': JSON.stringify(false),
    '__HMR_CLIENT_PORT__': JSON.stringify(''),
    '__HMR_CLIENT_HOST__': JSON.stringify(''),
    '__HMR_CLIENT_PROTOCOL__': JSON.stringify(''),
    '__HMR_CLIENT_TIMEOUT__': JSON.stringify(0),
    '__HMR_CLIENT_RETRY__': JSON.stringify(0),
    '__HMR_DIRECT_TARGET__': JSON.stringify(false),
    '__HMR_WEBSOCKET_RECONNECT__': JSON.stringify(false),
    '__HMR_WEBSOCKET_URL__': JSON.stringify(''),
    '__HMR_PROTOCOL__': JSON.stringify(''),
    '__HMR_PORT__': JSON.stringify(''),
    '__HMR_HOSTNAME__': JSON.stringify(''),
    
    // Additional development variables that might cause issues
    '__SERVER_HOST__': JSON.stringify(''),
    '__SERVER_PORT__': JSON.stringify(''),
    '__SERVER_PROTOCOL__': JSON.stringify(''),
    '__DEVTOOLS__': JSON.stringify(false),
    '__REACT_DEVTOOLS_GLOBAL_HOOK__': JSON.stringify({}),
    '__VITE_HMR_RUNTIME__': JSON.stringify(null),
    '__VITE_HMR_CLIENT__': JSON.stringify(null)
  },
  optimizeDeps: {
    exclude: [
      'react-devtools', 
      'react-dom/devtools', 
      '@vite/client',
      'react-refresh',
      'react-refresh/runtime'
    ]
  },
  resolve: {
    alias: {
      // Ensure React is properly resolved
      'react': 'react',
      'react-dom': 'react-dom'
    }
  },
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  }
})
