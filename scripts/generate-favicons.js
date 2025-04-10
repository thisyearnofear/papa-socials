const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "../public/icons");

// Create the icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Source favicon path
const faviconPath = path.join(__dirname, "../public/favicon.ico");

// Sizes to generate
const sizes = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

async function generateFavicons() {
  try {
    // Check if the favicon.ico exists
    if (!fs.existsSync(faviconPath)) {
      console.error("Error: favicon.ico not found in public directory");
      return;
    }

    // Convert .ico to PNG for processing
    const tempPngPath = path.join(__dirname, "temp-favicon.png");
    await sharp(faviconPath).toFile(tempPngPath);

    // Generate all sizes
    for (const { name, size } of sizes) {
      const outputPath = path.join(ICONS_DIR, name);
      await sharp(tempPngPath).resize(size, size).png().toFile(outputPath);
      console.log(`Generated ${name} (${size}x${size}px)`);
    }

    // Clean up temporary file
    fs.unlinkSync(tempPngPath);
    console.log("All favicon sizes generated successfully!");
  } catch (error) {
    console.error("Error generating favicons:", error);
  }
}

generateFavicons();
