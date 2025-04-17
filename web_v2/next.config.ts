import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3909/api/:path*' // 代理到后端服务
      }
    ]
  }
};

export default nextConfig;
