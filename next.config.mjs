/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.optimization.runtimeChunk = "single";
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
        },
      };
    }

    // Add url-loader for handling TensorFlow.js models (bin files)
    config.module.rules.push({
      test: /\.(bin)$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/octet-stream',
          },
        },
      ],
    });

    return config;
  },
  env: {
    NEXT_PUBLIC_AUTH_ENABLED: process.env.AUTH_ENABLED || "false",
  },
};

export default nextConfig;
