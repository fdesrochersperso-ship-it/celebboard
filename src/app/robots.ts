import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/api/", "/display/", "/submit/", "/invite/"],
      },
    ],
    sitemap: "https://celebboard.com/sitemap.xml",
  };
}
