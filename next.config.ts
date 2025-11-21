import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pds-eu-west4.test.certified.app",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.bsky.app",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
