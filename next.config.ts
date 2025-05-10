/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"], // ✅ Add this line
  },
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
