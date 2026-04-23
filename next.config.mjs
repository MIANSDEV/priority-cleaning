/** @type {import('next').NextConfig} */
const nextConfig = {
  // When NEXT_PUBLIC_API_URL is set, proxy all /api/* calls to that URL.
  // Set this in .env.local to use the production API during local development.
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return {
        afterFiles: [
          {
            source: "/api/:path*",
            destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
          },
        ],
      };
    }
    return [];
  },

  // Allow embedding via iframe in WordPress
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
