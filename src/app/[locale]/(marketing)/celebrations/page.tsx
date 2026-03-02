import { getTranslations } from "next-intl/server";
import { CelebrationsFeaturePage } from "@/components/marketing/sections/celebrations-feature";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.features" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/celebrations" : "/fr/celebrations",
      languages: { en: "/celebrations", fr: "/fr/celebrations" },
    },
  };
}

export default function CelebrationsPage() {
  return <CelebrationsFeaturePage />;
}
