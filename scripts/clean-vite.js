import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Post-build script to remove all Vite references
function cleanViteReferences() {
  const docsDir = path.join(__dirname, '..', 'docs');
  const indexPath = path.join(docsDir, 'index.js');
  
  console.log('🔥 Cleaning Vite references from production build...');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.js not found in docs directory');
    return;
  }
  
  // Read the built file
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Remove all Vite-related imports and references
  const originalSize = content.length;
  
  // Remove Vite client imports
  content = content.replace(/import["']\/@vite\/client["'];?/g, '');
  content = content.replace(/import["']@vite\/client["'];?/g, '');
  content = content.replace(/import["']vite\/client["'];?/g, '');
  content = content.replace(/import["']@vite\/env["'];?/g, '');
  content = content.replace(/import["']vite\/env["'];?/g, '');
  
  // Remove Vite-related function calls and references
  content = content.replace(/__vite_plugin_react_preamble_installed__/g, 'undefined');
  content = content.replace(/__VITE_HMR_RUNTIME__/g, 'null');
  content = content.replace(/__VITE_HMR_CLIENT__/g, 'null');
  content = content.replace(/__VITE_HMR_WS__/g, 'null');
  content = content.replace(/__VITE_HMR_PORT__/g, 'null');
  content = content.replace(/__VITE_HMR_HOST__/g, 'null');
  content = content.replace(/__VITE_HMR_PROTOCOL__/g, '""');
  content = content.replace(/__HMR_BASE__/g, '"/Weather-Forecaster/"');
  content = content.replace(/import\.meta\.hot/g, 'undefined');
  content = content.replace(/module\.hot/g, 'undefined');
  content = content.replace(/import\.meta\.env\.HMR/g, 'false');
  content = content.replace(/import\.meta\.env\.DEV/g, 'false');
  
  // Remove any remaining Vite-related patterns
  content = content.replace(/\/@vite\/client/g, '');
  content = content.replace(/@vite\/client/g, '');
  content = content.replace(/vite\/client/g, '');
  content = content.replace(/@vite\/env/g, '');
  content = content.replace(/vite\/env/g, '');
  
  // Clean up any remaining malformed import statements
  content = content.replace(/import\s*;?\s*/g, '');
  content = content.replace(/;\s*;/g, ';');
  
  const cleanedSize = content.length;
  const reduction = originalSize - cleanedSize;
  
  // Write the cleaned content back
  fs.writeFileSync(indexPath, content);
  
  console.log(`✅ Vite references cleaned successfully!`);
  console.log(`📊 Size reduction: ${reduction} bytes (${(reduction/originalSize*100).toFixed(2)}%)`);
  console.log(`📦 Original size: ${originalSize} bytes`);
  console.log(`📦 Cleaned size: ${cleanedSize} bytes`);
}

// Run the cleaning function
cleanViteReferences();
