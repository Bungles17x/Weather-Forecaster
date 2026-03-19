// Enhanced post-build script to remove all Vite references
import fs from 'fs';
import path from 'path';

const indexPath = path.join(process.cwd(), 'docs', 'index.js');

console.log('🔥 Cleaning Vite references from production build...');

try {
  let content = fs.readFileSync(indexPath, 'utf8');
  const originalSize = content.length;

  // More aggressive Vite client imports removal
  content = content.replace(/import\s*["']\/@vite\/client["'];?/g, '');
  content = content.replace(/import\s*["']@vite\/client["'];?/g, '');
  content = content.replace(/import\s*["']vite\/client["'];?/g, '');
  
  // Remove any encoded or minified Vite references
  content = content.replace(/["']\/@vite\/client["']/g, '""');
  content = content.replace(/["']@vite\/client["']/g, '""');
  content = content.replace(/["']vite\/client["']/g, '""');
  
  // Remove any potential dynamic imports
  content = content.replace(/import\s*\(\s*["']\/@vite\/client["']\s*\)/g, 'Promise.resolve()');
  content = content.replace(/import\s*\(\s*["']@vite\/client["']\s*\)/g, 'Promise.resolve()');
  content = content.replace(/import\s*\(\s*["']vite\/client["']\s*\)/g, 'Promise.resolve()');
  
  // Remove HMR and development variables
  content = content.replace(/import\.meta\.hot/g, 'undefined');
  content = content.replace(/module\.hot/g, 'undefined');
  content = content.replace(/import\.meta\.env\.HMR/g, 'false');
  content = content.replace(/__HMR_BASE__/g, '"/Weather-Forecaster/"');
  content = content.replace(/__VITE_HMR_RUNTIME__/g, 'null');
  content = content.replace(/__VITE_HMR_CLIENT__/g, 'null');
  content = content.replace(/__VITE_HMR_WS__/g, 'null');
  content = content.replace(/__VITE_HMR_PORT__/g, 'null');
  content = content.replace(/__VITE_HMR_HOST__/g, 'null');
  content = content.replace(/__VITE_HMR_PROTOCOL__/g, '""');
  
  // Fix malformed ForwardRef strings that might be created by replacements
  content = content.replace(/"ForwardRef\(\+e\+\)"/g, '"ForwardRef("+e+")"');
  content = content.replace(/"ForwardRef\(\+[^)]+\)"/g, match => {
    // Fix any malformed ForwardRef by ensuring proper parentheses
    return match.replace(/\+\)/, '+")');
  });
  
  // Remove any empty lines that might be created
  content = content.replace(/\n\s*\n/g, '\n');
  
  // Remove any malformed import statements
  content = content.replace(/import\s*["'][^"']*["'];?\s*/g, '');
  
  const cleanedSize = content.length;
  const sizeReduction = originalSize - cleanedSize;
  
  // Write the cleaned content back
  fs.writeFileSync(indexPath, content);
  
  console.log('✅ Vite references cleaned successfully!');
  console.log(`📊 Size reduction: ${sizeReduction} bytes (${(sizeReduction / originalSize * 100).toFixed(2)}%)`);
  console.log(`📦 Original size: ${originalSize} bytes`);
  console.log(`📦 Cleaned size: ${cleanedSize} bytes`);
  
  // Verify no Vite references remain
  const hasVite = content.includes('@vite') || 
                  content.includes('vite/client') || 
                  content.includes('/@vite/client');
  
  if (hasVite) {
    console.warn('⚠️  Warning: Vite references may still remain');
  } else {
    console.log('🎉 Verified: No Vite references found in cleaned file');
  }
  
} catch (error) {
  console.error('❌ Error cleaning Vite references:', error);
  process.exit(1);
}
