import type { MetadataRoute } from "next";
import { getArticles, getComparisonSlugs } from "@/lib/content";

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
    entries.push({
      url: `${baseUrl}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
    entries.push({
      url: `${baseUrl}/fr${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  // Blog articles (EN and FR)
  const enArticles = getArticles("en");
  const frArticles = getArticles("fr");
  for (const a of enArticles) {
    entries.push({
      url: `${baseUrl}/blog/${a.slug}`,
      lastModified: new Date(a.updatedAt ?? a.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    });
  }
  for (const a of frArticles) {
    entries.push({
      url: `${baseUrl}/fr/blog/${a.slug}`,
      lastModified: new Date(a.updatedAt ?? a.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    });
  }

  // Comparison pages (when vs/ content exists)
  const enComparisons = getComparisonSlugs("en");
  const frComparisons = getComparisonSlugs("fr");
  for (const slug of enComparisons) {
    entries.push({
      url: `${baseUrl}/vs/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    });
  }
  for (const slug of frComparisons) {
    entries.push({
      url: `${baseUrl}/fr/vs/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    });
  }

  return entries;
}
