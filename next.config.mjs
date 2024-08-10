/** @type {import('next').NextConfig} */
const nextConfig = {
  //   webpack: (config, { dev, isServer, webpack, nextRuntime }) => {
  //     config.module.rules.push({
  //       test: /\.node$/,
  //       use: [
  //         {
  //           loader: "nextjs-node-loader",
  //           options: {
  //             // flags: os.constants.dlopen.RTLD_NOW,
  //             outputPath: config.output.path,
  //           },
  //         },
  //       ],
  //     });
  //     return config;
  //   },
  experimental: {
    serverComponentsExternalPackages: ["@napi-rs/canvas"],
  },
};

export default nextConfig;
