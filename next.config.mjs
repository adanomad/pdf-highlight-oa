/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode in development for catching potential problems
  reactStrictMode: true,

  // Enables SWC for faster builds and hot reloading
  swcMinify: true,

  // Enable or customize webpack's configuration to improve development experience
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Enables hot module replacement
      config.optimization.runtimeChunk = "single";
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
        },
      };
    }

    return config;
  },
  env: {
    NEXT_PUBLIC_AUTH_ENABLED: process.env.AUTH_ENABLED || "false",
  },

  // Other Next.js configurations can be added here
};

export default nextConfig;
