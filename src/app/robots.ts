import type { MetadataRoute } from "next";
import { getSeoOrigin } from "../lib/config.ts";

export default function robots(): MetadataRoute.Robots {
  const origin = getSeoOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/auth/",
        "/dashboard/",
        "/forgot-password",
        "/login",
        "/register",
        "/reset-password",
      ],
    },
    sitemap: origin ? `${origin}/sitemap.xml` : undefined,
  };
}
