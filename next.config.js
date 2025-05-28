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

  // Ignore TypeScript errors during `next build`
  typescript: {
    ignoreBuildErrors: true,
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

  // Patch webpack so that any import of `react/jsx-runtime.js` or `react/jsx-dev-runtime.js`
  // (which some older libraries still try to pull in) is redirected to the real exports.
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react/jsx-runtime.js": require.resolve("react/jsx-runtime"),
      "react/jsx-dev-runtime.js": require.resolve("react/jsx-dev-runtime"),
    };
    return config;
  },
};

module.exports = nextConfig;
