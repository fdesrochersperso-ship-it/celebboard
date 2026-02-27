import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.privacy" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

function PrivacyContent() {
  const t = useTranslations("legal.privacy");
  return (
    <section className="bg-[#FAF9F7] px-6 py-24 lg:px-12" aria-labelledby="privacy-heading">
      <div className="mx-auto max-w-3xl">
        <h1 id="privacy-heading" className="text-h1 text-[#111]">
          {t("title")}
        </h1>
        <p className="mt-4 text-sm text-[#666]">
          {t("lastUpdated", { date: "2025-01-01" })}
        </p>
        <p className="mt-8 text-base leading-relaxed text-[#666]">{t("content")}</p>
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
