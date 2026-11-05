import fs from 'node:fs'
import path from 'node:path'

// Remove development-only Vite client injection from the generated static site.
// Vite's normal production output should not need this, but the source index in
// this project historically included the client tag explicitly.
const output = path.resolve('docs')
const index = path.join(output, 'index.html')
if (fs.existsSync(index)) {
  const html = fs.readFileSync(index, 'utf8')
  const cleaned = html
    .replace(/<script[^>]+src=["'][^"']*\/@vite\/client["'][^>]*><\/script>\s*/gi, '')
    .replace(/<script[^>]+src=["'][^"']*\/@vite\/env["'][^>]*><\/script>\s*/gi, '')
  fs.writeFileSync(index, cleaned)
  console.log('Cleaned development-only Vite scripts from docs/index.html')
} else {
  console.warn('docs/index.html not found; skipped static-output cleanup')
}
