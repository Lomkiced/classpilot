import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Client-side router cache: keep dynamic pages cached for 30 seconds
  // on client-side navigations. This means switching between Dashboard → Classes
  // → Gradebook won't re-fetch if you navigate back within 30s.
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  // Development: log all fetch calls to help debug data loading patterns
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
