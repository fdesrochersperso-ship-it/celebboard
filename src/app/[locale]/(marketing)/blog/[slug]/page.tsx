import { getArticle, getArticles } from "@/lib/content";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const enArticles = getArticles("en");
  const frArticles = getArticles("fr");
  return [
    ...enArticles.map((a) => ({ locale: "en", slug: a.slug })),
    ...frArticles.map((a) => ({ locale: "fr", slug: a.slug })),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticle(locale, slug);
  if (!article) return {};

  const { meta } = article;
  const title = meta.seoTitle || meta.title;
  const description = meta.seoDescription || meta.description;
  const url = locale === "en" ? `/blog/${slug}` : `/fr/blog/${slug}`;

  return {
    title: `${title} | CelebBoard`,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `/blog/${slug}`,
        fr: `/fr/blog/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: meta.publishedAt,
      modifiedTime: meta.updatedAt,
      authors: [meta.author],
      images: meta.featuredImage
        ? [{ url: meta.featuredImage, alt: meta.featuredImageAlt ?? "" }]
        : [],
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const article = getArticle(locale, slug);
  if (!article) notFound();

  const { meta, content } = article;
  const t = await getTranslations({ locale, namespace: "blog" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.publishedAt,
    dateModified: meta.updatedAt || meta.publishedAt,
    author: { "@type": "Organization", name: "CelebBoard" },
    publisher: {
      "@type": "Organization",
      name: "CelebBoard",
      logo: { "@type": "ImageObject", url: "https://celebboard.com/logo.png" },
    },
    image: meta.featuredImage,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://celebboard.com/blog/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="bg-[#FAF9F7] px-6 py-24 lg:px-12">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-8 inline-block text-sm font-medium text-[#78716C] transition-colors hover:text-[#F59E0B]"
          >
            {t("backToBlog")}
          </Link>
          <header className="mb-10">
            <h1 className="text-h1 text-[#111]">{meta.title}</h1>
            <p className="mt-4 text-lg text-[#666]">{meta.description}</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#78716C]">
              <time dateTime={meta.publishedAt}>{meta.publishedAt}</time>
              <span>·</span>
              <span>{meta.readingTime}</span>
            </div>
          </header>
          <div className="prose prose-lg prose-stone max-w-none prose-headings:text-[#111] prose-p:text-[#44403C] prose-a:text-[#F59E0B] prose-a:no-underline hover:prose-a:underline">
            <MDXRemote source={content} />
          </div>
        </article>
      </section>
    </>
  );
}
