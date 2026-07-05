import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/gestao-aulas",
  images: { unoptimized: true },
};

export default nextConfig;
