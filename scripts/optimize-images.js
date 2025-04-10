const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

// Configuration
const config = {
  inputDir: 'public',
  outputDir: 'public/optimized',
  quality: 80,
  maxWidth: 1920,
  formats: ['webp', 'avif'],
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Find all images in the input directory
const imageFiles = glob.sync(`${config.inputDir}/**/*.{jpg,jpeg,png,gif}`);

console.log(`Found ${imageFiles.length} images to optimize`);

// Process each image
(async () => {
  for (const file of imageFiles) {
    const filename = path.basename(file);
    const relativePath = path.relative(config.inputDir, path.dirname(file));
    const outputPath = path.join(config.outputDir, relativePath);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    try {
      // Load the image
      const image = sharp(file);
      
      // Get image metadata
      const metadata = await image.metadata();
      
      // Resize if larger than maxWidth
      const width = metadata.width > config.maxWidth ? config.maxWidth : null;
      
      // Process image for each format
      for (const format of config.formats) {
        const outputFile = path.join(outputPath, `${path.parse(filename).name}.${format}`);
        
        let processedImage = image;
        if (width) {
          processedImage = processedImage.resize(width);
        }
        
        // Convert to the target format
        if (format === 'webp') {
          await processedImage.webp({ quality: config.quality }).toFile(outputFile);
        } else if (format === 'avif') {
          await processedImage.avif({ quality: config.quality }).toFile(outputFile);
        }
        
        console.log(`Optimized: ${outputFile}`);
      }
      
      // Also save as original format but optimized
      const outputFile = path.join(outputPath, filename);
      let processedImage = image;
      if (width) {
        processedImage = processedImage.resize(width);
      }
      
      await processedImage
        .jpeg({ quality: config.quality, mozjpeg: true })
        .toFile(outputFile);
      
      console.log(`Optimized: ${outputFile}`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  console.log('Image optimization complete!');
})();
