import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.terms" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

function TermsContent() {
  const t = useTranslations("legal.terms");
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("lastUpdated", { date: "2025-01-01" })}
        </p>
        <p className="mt-8 text-muted-foreground">{t("content")}</p>
      </div>
    </section>
  );
}

export default function TermsPage() {
  return <TermsContent />;
}
