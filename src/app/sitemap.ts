import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://celebboard.com";

  // Static pages — EN (no prefix) and FR (/fr)
  const staticPages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/features", priority: 0.9, changeFrequency: "monthly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/legal/terms", priority: 0.5, changeFrequency: "monthly" },
    { path: "/legal/privacy", priority: 0.5, changeFrequency: "monthly" },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    // English (no prefix)
    entries.push({
      url: `${baseUrl}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
    // French
    entries.push({
      url: `${baseUrl}/fr${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  return entries;
}
