import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Set VITE_BASE_PATH=/ for a custom domain; keep the repository path for GitHub Pages.
  const base = mode === 'production' ? (env.VITE_BASE_PATH || '/Weather-Forecaster/') : '/'
  return {
    plugins: [react()],
    base,
    // One version number for the app shell, the settings footer and diagnostics.
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version)
    },
    build: {
      outDir: 'docs',
      emptyOutDir: true,
      sourcemap: false,
      target: 'es2020'
    },
    server: { host: true, port: 5173, strictPort: true },
    preview: { host: true, port: 4173, strictPort: true }
  }
})
