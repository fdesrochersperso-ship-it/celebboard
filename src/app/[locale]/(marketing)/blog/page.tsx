import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getArticles } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.blog" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/blog" : "/fr/blog",
      languages: { en: "/blog", fr: "/fr/blog" },
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const articles = getArticles(locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  return (
    <section
      className="bg-[#FAF9F7] px-6 py-24 lg:px-12"
      aria-labelledby="blog-heading"
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Blog
        </p>
        <h1 id="blog-heading" className="text-h1 text-[#111]">
          {t("hero.title")}
        </h1>
        <p className="mt-6 text-base text-[#666]">{t("hero.subtitle")}</p>

        {articles.length === 0 ? (
          <div className="mt-12 rounded-lg border border-[#E7E5E4] bg-white p-8 text-center">
            <p className="text-[#666]">{t("noArticles")}</p>
            <Link
              href="/signup"
              className="mt-6 inline-flex h-12 items-center justify-center bg-[#111] px-8 py-3.5 text-[15px] font-semibold text-[#FAFAFA] transition-all hover:translate-y-[-1px] hover:bg-[#222]"
            >
              {t("cta")}
            </Link>
          </div>
        ) : (
          <div className="mt-12 space-y-10">
            {articles.map((article) => (
              <article
                key={article.slug}
                className="border-b border-[#E7E5E4] pb-10 last:border-0"
              >
                <Link href={`/blog/${article.slug}`} className="group block">
                  <h2 className="text-2xl font-semibold text-[#111] transition-colors group-hover:text-[#F59E0B]">
                    {article.title}
                  </h2>
                </Link>
                <p className="mt-2 text-base text-[#666]">
                  {article.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#78716C]">
                  <time dateTime={article.publishedAt}>{article.publishedAt}</time>
                  <span>·</span>
                  <span>{article.readingTime}</span>
                  <span>·</span>
                  <span className="capitalize">{article.category}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
