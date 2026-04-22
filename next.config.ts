import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/north-star-donors',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
