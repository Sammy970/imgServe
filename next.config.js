// Your config here /** @type {import('next').NextConfig} */
const nextConfig = {
    // experimental: {
    //   serverComponentsExternalPackages: ["@napi-rs/canvas"],
    // },
    async rewrites() {
      return [
        {
          source: "/image/tr:transformation/:asset*",
          destination: "/api/image?transformation=:transformation&asset=:asset*",
        },
        {
          source: "/image/:asset*",
          destination: "/api/image?asset=:asset*",
        },
        {
          source: "/image/:asset*",
          has: [
            {
              type: "query",
              key: "tr",
            },
          ],
          destination: "/api/image?transformation=:tr&asset=:asset*",
        },
      ];
    },
    images: {
      domains: ["imgserve.vercel.app", "localhost"],
    },
    experimental: {
      serverComponentsExternalPackages: ["onnxruntime-node"],
      outputFileTracingIncludes: {
        "./app/api/image/route": ["./fonts/*"],
      },
    },
    webpack: (config, context) => {
      config.externals.push("@napi-rs/canvas");
      config.externals.push("@imgly/background-removal-node");
      config.externals.push("onnxruntime-node");
      return config;
    },
  };
  
  module.exports = nextConfig;
  