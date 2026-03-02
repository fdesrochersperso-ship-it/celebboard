import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const contentDir = path.join(process.cwd(), "src/content");

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  featuredImageAlt?: string;
  readingTime: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  noindex?: boolean;
}

export interface Article {
  meta: ArticleMeta;
  content: string;
}

export function getArticles(locale: string): ArticleMeta[] {
  const dir = path.join(contentDir, "blog", locale);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);
      const stats = readingTime(content);
      return {
        slug: file.replace(".mdx", ""),
        readingTime: stats.text,
        ...data,
      } as ArticleMeta;
    })
    .filter((a) => !a.noindex)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export function getArticle(locale: string, slug: string): Article | null {
  const filePath = path.join(contentDir, "blog", locale, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    meta: {
      slug,
      readingTime: stats.text,
      ...data,
    } as ArticleMeta,
    content,
  };
}

export function getArticleSlugs(locale: string): string[] {
  const articles = getArticles(locale);
  return articles.map((a) => a.slug);
}

export function getComparisonPage(
  locale: string,
  competitor: string
): Article | null {
  const filePath = path.join(contentDir, "vs", locale, `${competitor}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    meta: {
      slug: competitor,
      readingTime: stats.text,
      ...data,
    } as ArticleMeta,
    content,
  };
}

export function getComparisonSlugs(locale: string): string[] {
  const dir = path.join(contentDir, "vs", locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(".mdx", ""));
}
