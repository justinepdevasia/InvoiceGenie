import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
};

export default nextConfig;
