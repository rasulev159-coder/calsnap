/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@calsnap/shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://calsnapbackend-production.up.railway.app',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1064929145470-1nopq0062hvv5l9d7i5iula6a4s9fu30.apps.googleusercontent.com',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://calsnapbackend-production.up.railway.app'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
