/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'maps.gstatic.com', pathname: '/**' },
      { protocol: 'https', hostname: 'pbs.twimg.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: { enabled: true },
  },
};
