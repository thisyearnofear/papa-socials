/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel: use standalone tracing to reduce function size
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    // Reduced from 7+8 sizes to 3+3 — cuts .next/cache/images ~70%
    deviceSizes: [640, 1080, 1920],
    imageSizes: [64, 128, 256],
    minimumCacheTTL: 31536000, // 1 year — avoid re-generating every 60s
    dangerouslyAllowSVG: false,
    contentDispositionType: "inline",
    remotePatterns: [
      { protocol: "https", hostname: "w3s.link" },
      { protocol: "https", hostname: "**.ipfs.io" },
      { protocol: "https", hostname: "**.pinata.cloud" },
      { protocol: "https", hostname: "dweb.link" },
      { protocol: "https", hostname: "gateway.pinata.cloud" },
    ],
  },
  compress: true,
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif)",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  // Grove/Lens storage uses native fetch — no Node polyfills needed
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
