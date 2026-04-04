const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputDir = path.join(__dirname); // Root directory of your project
const outputDir = path.join(__dirname, 'protected');

const ignoreDirs = ['node_modules', 'protected', '.git'];

function obfuscateDirectory(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const items = fs.readdirSync(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    // Skip ignored folders
    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(item)) {
        obfuscateDirectory(srcPath, destPath);
      }
    } else if (stat.isFile() && path.extname(item) === '.js') {
      console.log(`Obfuscating: ${srcPath}`);
      const command = `javascript-obfuscator "${srcPath}" --output "${destPath}" --compact true --control-flow-flattening true`;
      execSync(command);
    } else if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath); // Copy other file types (e.g., .json, .env, etc.)
    }
  }
}

obfuscateDirectory(inputDir, outputDir);
console.log('✅ All JS files obfuscated to ./protected directory');
