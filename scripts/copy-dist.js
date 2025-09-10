const fs = require('fs');
const path = require('path');

// Create api directory if it doesn't exist
if (!fs.existsSync('api')) {
  fs.mkdirSync('api');
}

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy dist to api
try {
  copyDir('dist', 'api');
  console.log('✅ Successfully copied dist files to api directory');
} catch (error) {
  console.error('❌ Error copying dist files:', error);
  process.exit(1);
}
