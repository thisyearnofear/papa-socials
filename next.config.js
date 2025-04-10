/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["use.typekit.net"],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Enable compression
  compress: true,
  // Optimize for production
  swcMinify: true,
  // Configure Netlify image optimization
  env: {
    // Add any environment variables needed for image optimization
    IMAGE_OPTIMIZATION: "true",
  },
};

module.exports = nextConfig;
