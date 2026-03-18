const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join('public', 'assets');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.toLowerCase().endsWith('.heic')) {
        results.push(file);
      }
    }
  });
  return results;
}

const heicFiles = walk(assetsDir);
console.log(`Found ${heicFiles.length} HEIC files to convert.`);

heicFiles.forEach((file) => {
  const outputPath = file.replace(/\.[^/.]+$/, "") + ".jpg";
  sharp(file)
    .jpeg({ quality: 85 })
    .toFile(outputPath)
    .then(() => console.log(`Converted: ${file} -> ${outputPath}`))
    .catch((err) => console.error(`Error converting ${file}:`, err));
});
