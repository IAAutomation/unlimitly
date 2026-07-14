#!/usr/bin/env node
// Full extension build: obfuscate JS -> dist/ -> zip to public/unlimitly-extension.zip
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const distDir = path.join(root, 'dist');
const zipOut = path.resolve(root, '..', 'public', 'unlimitly-extension.zip');

// 1. Clean dist
if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });

// 2. Obfuscate (writes JS + copies assets into dist/)
console.log('▶ Obfuscating extension source...');
execSync('node obfuscate.js', { cwd: root, stdio: 'inherit' });

// 3. Zip dist/ -> public/unlimitly-extension.zip using nix zip (system zip not present)
console.log('\n▶ Packaging zip...');
if (fs.existsSync(zipOut)) fs.rmSync(zipOut);
fs.mkdirSync(path.dirname(zipOut), { recursive: true });
try {
  execSync(`nix run nixpkgs#zip -- -r "${zipOut}" .`, { cwd: distDir, stdio: 'inherit' });
} catch (e) {
  // Fallback: try plain `zip`
  execSync(`zip -r "${zipOut}" .`, { cwd: distDir, stdio: 'inherit' });
}
console.log(`\n✓ Built ${path.relative(path.resolve(root, '..'), zipOut)}`);