/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.API_INTERNAL_URL 
          ? `${process.env.API_INTERNAL_URL}/api/:path*` 
          : 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

