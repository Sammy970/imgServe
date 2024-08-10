/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@napi-rs/canvas"],
  },
  async rewrites() {
    return [
      {
        source: '/tr:transformation/:asset*',
        destination: '/api/image?transformation=:transformation&asset=:asset*',
      },
    ];
  },
};

export default nextConfig;
