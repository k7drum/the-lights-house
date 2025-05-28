/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Google user content
  images: {
    domains: ["lh3.googleusercontent.com"],
  },

  // Skip ESLint and TypeScript errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Redirect root → /frontend/home
  async redirects() {
    return [
      {
        source: "/",
        destination: "/frontend/home",
        permanent: true,
      },
    ];
  },

  // Patch out any legacy imports of the native-tailwind-oxide binaries
  // and fix React-DnD’s import of jsx-runtime
  webpack(config) {
    // Redirect oxide imports to the JS version (built into tailwindcss)
    if (config.resolve.alias) {
      delete config.resolve.alias["@tailwindcss/oxide"];
      delete config.resolve.alias["@tailwindcss/oxide-linux-x64-gnu"];
      delete config.resolve.alias["@tailwindcss/oxide-win32-x64-msvc"];
    }

    // Fix libraries still trying to pull in these paths
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react/jsx-runtime.js": require.resolve("react/jsx-runtime"),
      "react/jsx-dev-runtime.js": require.resolve("react/jsx-dev-runtime"),
    };

    return config;
  },
};

module.exports = nextConfig;
