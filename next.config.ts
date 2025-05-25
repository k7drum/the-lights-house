/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Google user content
  images: {
    domains: ["lh3.googleusercontent.com"],
  },

  // Ignore ESLint errors during `next build`
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Preserve your existing redirect
  async redirects() {
    return [
      {
        source: "/",
        destination: "/frontend/home",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
