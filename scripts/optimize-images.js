const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const rimraf = require('rimraf'); // Add this to your dependencies if not present

// Function to clear directory
function clearDirectory(directory) {
  return new Promise((resolve, reject) => {
    rimraf(directory, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

const QUALITY = {
  jpg: 80,
  webp: 75,
  avif: 60
};

const SIZES = [640, 750, 828, 1080, 1200, 1920];
const OPTIMIZED_DIR = path.join(process.cwd(), 'public', 'optimized');

async function optimizeImage(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Create output directory if it doesn't exist
  await fs.mkdir(outputDir, { recursive: true });

  // Generate responsive sizes
  for (const width of SIZES.filter(w => w <= metadata.width)) {
    const resized = image.resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });

    // Generate AVIF
    await resized
      .avif({ quality: QUALITY.avif })
      .toFile(path.join(outputDir, `${filename}-${width}.avif`));

    // Generate WebP
    await resized
      .webp({ quality: QUALITY.webp })
      .toFile(path.join(outputDir, `${filename}-${width}.webp`));

    // Generate optimized JPEG
    await resized
      .jpeg({ quality: QUALITY.jpg, mozjpeg: true })
      .toFile(path.join(outputDir, `${filename}-${width}.jpg`));
  }

  // Generate original size in all formats
  await image
    .avif({ quality: QUALITY.avif })
    .toFile(path.join(outputDir, `${filename}.avif`));
  
  await image
    .webp({ quality: QUALITY.webp })
    .toFile(path.join(outputDir, `${filename}.webp`));
  
  await image
    .jpeg({ quality: QUALITY.jpg, mozjpeg: true })
    .toFile(path.join(outputDir, `${filename}.jpg`));

  console.log(`Optimized: ${filename}`);
}

async function processDirectory(dir) {
  const files = await fs.readdir(dir);
  
  for (const file of files) {
    const inputPath = path.join(dir, file);
    const stat = await fs.stat(inputPath);
    
    if (stat.isDirectory()) {
      // Skip the optimized directory to prevent recursive optimization
      if (inputPath.includes('optimized')) {
        continue;
      }
      await processDirectory(inputPath);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      const relativePath = path.relative(path.join(process.cwd(), 'public'), dir);
      const outputDir = path.join(OPTIMIZED_DIR, relativePath);
      await optimizeImage(inputPath, outputDir);
    }
  }
}

// Main execution
(async () => {
  try {
    console.log('Clearing existing optimized images...');
    await clearDirectory(OPTIMIZED_DIR);
    console.log('Optimized directory cleared');

    console.log('Starting image optimization...');
    await processDirectory(path.join(process.cwd(), 'public'));
    console.log('Image optimization complete!');
  } catch (error) {
    console.error('Error during image optimization:', error);
    process.exit(1);
  }
})();
