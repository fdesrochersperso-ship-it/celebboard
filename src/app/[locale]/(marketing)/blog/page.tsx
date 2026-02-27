import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

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
  };
}

function BlogContent() {
  const t = useTranslations("blog");
  return (
    <section className="bg-[#FAF9F7] px-6 py-24 lg:px-12" aria-labelledby="blog-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Blog
        </p>
        <h1 id="blog-heading" className="text-h1 text-[#111]">
          {t("hero.title")}
        </h1>
        <p className="mt-6 text-base text-[#666]">{t("hero.subtitle")}</p>
        <p className="mt-8 text-base text-[#666]">{t("comingSoon")}</p>
        <Link
          href="/signup"
          className="mt-8 inline-flex h-12 items-center justify-center bg-[#111] px-8 py-3.5 text-[15px] font-semibold text-[#FAFAFA] transition-all hover:translate-y-[-1px] hover:bg-[#222]"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}

export default function BlogPage() {
  return <BlogContent />;
}
