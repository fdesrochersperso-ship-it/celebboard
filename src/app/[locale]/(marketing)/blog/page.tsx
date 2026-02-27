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
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold">{t("hero.title")}</h1>
        <p className="mt-4 text-muted-foreground">{t("hero.subtitle")}</p>
        <p className="mt-8 text-muted-foreground">{t("comingSoon")}</p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
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
