import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

test('all relative CSS imports point to files that exist', () => {
  const sourceFiles = walk(path.join(root, 'src')).filter(file => /\.(jsx?|mjs)$/.test(file))
  const imports = []
  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/(?:import\s+[^'";]*?from\s*|import\s*)['"]([^'"]+\.css)['"]/g)) {
      const specifier = match[1]
      if (specifier.startsWith('.')) imports.push({ file, specifier, resolved: path.resolve(path.dirname(file), specifier) })
    }
  }
  assert.ok(imports.length > 0, 'expected CSS imports to be present')
  const missing = imports.filter(item => !existsSync(item.resolved))
  assert.deepEqual(missing.map(item => `${path.relative(root, item.file)} -> ${item.specifier}`), [])
})

test('all primary page stylesheets are wired into their pages', () => {
  const required = [
    ['src/pages/HomePage.jsx', "import './HomePage.css'"],
    ['src/pages/ForecastPage.jsx', "import './ForecastPage.css'"],
    ['src/pages/MapPage.jsx', "import './MapPage.css'"],
    ['src/pages/AssistantPage.jsx', "import './AssistantPage.css'"],
    ['src/pages/SettingsPage.jsx', "import './SettingsPage.css'"],
    ['src/pages/AnalysisPage.jsx', "import './AnalysisPage.css'"],
    ['src/pages/ObservationsPage.jsx', "import './ObservationsPage.css'"],
    ['src/components/WeatherMap.jsx', "import './WeatherMap.css'"],
    ['src/main.jsx', "import './design-polish.css'"]
  ]
  for (const [file, snippet] of required) {
    assert.ok(readFileSync(path.join(root, file), 'utf8').includes(snippet), `${file} must import ${snippet}`)
    const cssName = snippet.match(/['"]([^'"]+\.css)['"]/)[1]
    const cssPath = path.resolve(root, path.dirname(file), cssName)
    assert.ok(existsSync(cssPath), `${cssPath} must exist`)
  }
})

test('every stylesheet has balanced braces', () => {
  const cssFiles = walk(path.join(root, 'src')).filter(file => file.endsWith('.css'))
  assert.ok(cssFiles.length >= 10, 'expected page and component stylesheets')
  for (const file of cssFiles) {
    const css = readFileSync(file, 'utf8')
    let depth = 0
    for (const char of css) {
      if (char === '{') depth++
      if (char === '}') depth--
      assert.ok(depth >= 0, `${path.relative(root, file)} has an unexpected closing brace`)
    }
    assert.equal(depth, 0, `${path.relative(root, file)} has unbalanced braces`)
  }
})

test('runtime error monitor stylesheet exists and is imported', () => {
  const component = readFileSync(path.join(root, 'src/components/RuntimeErrorMonitor.jsx'), 'utf8')
  assert.ok(component.includes("import './RuntimeErrorMonitor.css'"))
  assert.ok(existsSync(path.join(root, 'src/components/RuntimeErrorMonitor.css')))
  assert.ok(component.includes("window.addEventListener('error'"))
  assert.ok(component.includes("window.addEventListener('unhandledrejection'"))
  assert.ok(component.includes('console.error ='))
})
