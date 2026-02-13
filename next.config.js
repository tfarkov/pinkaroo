module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['res.cloudinary.com', 'maps.gstatic.com', 'pbs.twimg.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: true,
    concurrentFeatures: true, // For React 19
  },
  sentry: {
    hideSourceMaps: true,
  },
};
