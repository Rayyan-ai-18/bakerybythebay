// One-off: resize Shopify product photos to 800px WebP for fast web loading.
// Run with sharp installed: npm install --no-save sharp && node scripts/compress-product-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'images', 'products');

(async () => {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  let before = 0, after = 0;
  for (const f of files) {
    const src = path.join(dir, f);
    const out = path.join(dir, f.replace(/\.png$/, '.webp'));
    const b = fs.statSync(src).size; before += b;
    await sharp(src).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
    const a = fs.statSync(out).size; after += a;
    console.log(`${f.padEnd(28)} ${(b / 1024 | 0)}KB -> ${(a / 1024 | 0)}KB`);
    fs.unlinkSync(src);
  }
  console.log(`\nTotal: ${(before / 1048576).toFixed(1)}MB -> ${(after / 1048576).toFixed(2)}MB`);
})();
