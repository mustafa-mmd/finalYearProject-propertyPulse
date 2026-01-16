const fs = require('fs');
const path = require('path');

console.log('✅ Checking favicon setup...\n');

// Check layout.js
const layoutPath = path.join(__dirname, 'app', 'layout.js');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  const hasTitle = layoutContent.includes('PropertyPulse | Find Your Dream Home');
  const hasFavicon = layoutContent.includes('🏠</text></svg>');
  
  console.log('📄 layout.js check:');
  console.log(`   Title found: ${hasTitle ? '✅' : '❌'}`);
  console.log(`   Favicon found: ${hasFavicon ? '✅' : '❌'}`);
} else {
  console.log('❌ layout.js not found at:', layoutPath);
}

// Check site.webmanifest
const manifestPath = path.join(__dirname, 'public', 'site.webmanifest');
if (fs.existsSync(manifestPath)) {
  console.log('\n📄 site.webmanifest: ✅ Found');
} else {
  console.log('\n📄 site.webmanifest: ❌ Not found - creating...');
  const manifest = {
    "name": "PropertyPulse",
    "short_name": "PropertyPulse",
    "description": "Find Your Dream Home",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#3b82f6",
    "icons": [{
      "src": "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%233b82f6%22>🏠</text></svg>",
      "sizes": "any",
      "type": "image/svg+xml"
    }]
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('   ✅ Created site.webmanifest');
}

console.log('\n🎯 Setup complete! Your site will now show:');
console.log('   • Title: "PropertyPulse | Find Your Dream Home"');
console.log('   • Favicon: Blue house emoji (🏠)');
console.log('   • Professional property-related branding\n');

console.log(' Next steps:');
console.log('   1. Save all files');
console.log('   2. Run: npm run build (to test)');
console.log('   3. Commit & push to GitHub');
console.log('   4. Deploy on Vercel\n');