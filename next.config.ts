import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow embedding via iframe in WordPress
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Allow embedding in WordPress iframes
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
