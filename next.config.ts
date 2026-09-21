import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  async redirects() {
    return [
      { source: "/leave/types", destination: "/leave/settings/types", permanent: false },
      {
        source: "/leave/policies/:path*",
        destination: "/leave/settings/policies/:path*",
        permanent: false,
      },
      { source: "/leave/assignments", destination: "/leave/settings/assignments", permanent: false },
      { source: "/leave/workflows", destination: "/leave/settings/workflows", permanent: false },
      { source: "/leave/calendars", destination: "/leave/settings/calendars", permanent: false },
      {
        source: "/leave/public-holidays",
        destination: "/leave/settings/public-holidays",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
