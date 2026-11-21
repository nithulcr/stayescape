import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const isDevelopment = process.env.NODE_ENV !== "production";
const supabaseSources = ["https://*.supabase.co", "wss://*.supabase.co"];
if (supabaseHostname && supabaseHostname !== "localhost" && !supabaseHostname.endsWith(".supabase.co")) {
  supabaseSources.push(`https://${supabaseHostname}`, `wss://${supabaseHostname}`);
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseSources.join(" ")} https://api.razorpay.com`,
  "frame-src https://checkout.razorpay.com",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  cacheComponents: false,
  images: {
    qualities: [60, 75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      ...(supabaseHostname && supabaseHostname !== "localhost"
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          ...(isDevelopment
            ? []
            : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
