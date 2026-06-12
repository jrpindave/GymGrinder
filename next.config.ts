import type { NextConfig } from "next";

// Static export for GitHub Pages, served at https://jrpindave.github.io/GymGrinder/
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/GymGrinder' : '',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
