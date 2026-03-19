import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'
  
  return {
    esbuild: {
      jsx: 'automatic'
    },
    base: isProduction ? '/Weather-Forecaster/' : '/', // Use relative base for development
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
        external: [
          '@vite/client',
          '@vite/env',
          'vite/client',
          'vite/env',
          '/@vite/client',
          '/@vite/env',
          'react-devtools',
          'react-dom/devtools',
          'react-refresh',
          'react-refresh/runtime'
        ]
      },
      sourcemap: false,
      target: 'es2015',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction, // Only remove console in production
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.warn', 'console.error'] : []
        },
        mangle: {
          reserved: ['React', 'useState', 'useEffect']
        }
      }
    },
    server: {
      port: 5173,
      host: true,
      hmr: {
        overlay: true // Enable HMR overlay in development
      }
    },
    define: {
      // Environment variables - dynamic based on mode
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.DEV': JSON.stringify(isDevelopment),
      'import.meta.env.PROD': JSON.stringify(isProduction),
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.BASE_URL': JSON.stringify(isProduction ? '/Weather-Forecaster/' : '/'),
      'import.meta.env.SSR': JSON.stringify(false),
      
      // Vite internal variables - only set in production
      ...(isProduction ? {
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
        '__HMR_BASE__': JSON.stringify('/Weather-Forecaster/'),
        '__HMR_OVERLAY__': JSON.stringify(false),
        
        // Additional development variables that might cause issues
        '__SERVER_HOST__': JSON.stringify(''),
        '__SERVER_PORT__': JSON.stringify(''),
        '__SERVER_PROTOCOL__': JSON.stringify(''),
        '__DEVTOOLS__': JSON.stringify(false),
        '__REACT_DEVTOOLS_GLOBAL_HOOK__': JSON.stringify({}),
        '__VITE_HMR_RUNTIME__': JSON.stringify(null),
        '__VITE_HMR_CLIENT__': JSON.stringify(null),
        '__VITE_HMR_OVERLAY__': JSON.stringify(null),
        '__VITE_HMR_WS__': JSON.stringify(null),
        '__VITE_HMR_PORT__': JSON.stringify(null),
        '__VITE_HMR_HOST__': JSON.stringify(null),
        '__VITE_HMR_PROTOCOL__': JSON.stringify(null),
        '__VITE_HMR_TIMEOUT__': JSON.stringify(null),
        '__VITE_HMR_RELOAD_DELAY__': JSON.stringify(null),
        '__VITE_HMR_MAX_RETRIES__': JSON.stringify(null),
        '__VITE_HMR_CLEAR_CONSOLE__': JSON.stringify(null),
        '__VITE_HMR_DEAD_TIMEOUT__': JSON.stringify(null),
        '__VITE_HMR_HEADER__': JSON.stringify({}),
        '__VITE_HMR_CLIENT_RECONNECT__': JSON.stringify(false),
        '__VITE_HMR_BROWSER__': JSON.stringify(false),
        '__VITE_HMR_HOSTNAME__': JSON.stringify(''),
        
        // Aggressive exclusion of all Vite development modules
        'import.meta.hot': JSON.stringify(undefined),
        'import.meta.env.HMR': JSON.stringify(false),
        'import.meta.env.DEV': JSON.stringify(false),
        'module.hot': JSON.stringify(undefined),
        'hot': JSON.stringify(undefined)
      } : {})
    },
    optimizeDeps: {
      exclude: isProduction ? [
        'react-devtools', 
        'react-dom/devtools', 
        '@vite/client',
        '@vite/env',
        'vite/client',
        'vite/env',
        'react-refresh',
        'react-refresh/runtime'
      ] : []
    },
    resolve: {
      alias: {
        'react': 'react',
        'react-dom': 'react-dom'
      }
    },
    css: {
      devSourcemap: isDevelopment,
      preprocessorOptions: {
        css: {
          charset: false
        }
      }
    }
  }
})
