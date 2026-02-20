import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Disable URL normalization in proxy to allow absolute redirect URLs
  // This is required for localhost → 127.0.0.1 redirect to work properly
  skipMiddlewareUrlNormalize: true,

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
        hostname: "climateai.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.bsky.app",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "bsky.social",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
