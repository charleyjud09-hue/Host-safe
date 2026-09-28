import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Product limit is 10MB per attachment; multipart/form-data adds
      // boundary and header overhead on top of the raw file bytes, so the
      // transport limit is set a little above that, not equal to it.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
