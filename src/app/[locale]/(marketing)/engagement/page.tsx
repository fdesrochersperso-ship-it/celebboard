import { getTranslations } from "next-intl/server";
import { EngagementFeaturePage } from "@/components/marketing/sections/engagement-feature";

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
      canonical: locale === "en" ? "/engagement" : "/fr/engagement",
      languages: { en: "/engagement", fr: "/fr/engagement" },
    },
  };
}

export default function EngagementPage() {
  return <EngagementFeaturePage />;
}
