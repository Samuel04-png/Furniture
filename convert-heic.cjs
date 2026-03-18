const sharp = require('sharp');
const path = require('path');

const inputPath = path.join('public', 'assets', 'Built for family dinners, festive feasts, and everything in between.#sikalehome #chairs #dining.heic');
const outputPath = path.join('public', 'assets', 'converted-dining-feast.jpg');

sharp(inputPath)
  .jpeg({ quality: 85 })
  .toFile(outputPath)
  .then(() => console.log('HEIC converted to JPG successfully'))
  .catch((err) => {
    console.error('Error converting HEIC:', err);
    process.exit(1);
  });
