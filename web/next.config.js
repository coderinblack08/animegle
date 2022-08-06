/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  // devServer: {
  //   proxy: {
  //     "/": {
  //       target: "http://localhost:3000",
  //       changeOrigin: true, //允许跨域
  //       ws: false,
  //     },
  //   },
  // },
};

module.exports = nextConfig;
