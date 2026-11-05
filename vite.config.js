import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Set VITE_BASE_PATH=/ for a custom domain; keep the repository path for GitHub Pages.
  const base = mode === 'production' ? (env.VITE_BASE_PATH || '/Weather-Forecaster/') : '/'
  return {
    plugins: [react()],
    base,
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
