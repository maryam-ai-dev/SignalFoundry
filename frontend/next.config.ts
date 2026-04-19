import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/today", permanent: false },
      { source: "/strategy", destination: "/studio", permanent: false },
      { source: "/memory", destination: "/vault", permanent: false },
      { source: "/engagement", destination: "/today", permanent: false },
      { source: "/voice", destination: "/settings#voice", permanent: false },
      { source: "/campaigns", destination: "/settings#campaigns", permanent: false },
    ];
  },
};

export default nextConfig;
