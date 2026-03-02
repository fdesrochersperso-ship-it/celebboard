import { getTranslations } from "next-intl/server";
import { DashboardFeaturePage } from "@/components/marketing/sections/dashboard-feature";

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
      canonical: locale === "en" ? "/dashboard" : "/fr/dashboard",
      languages: { en: "/dashboard", fr: "/fr/dashboard" },
    },
  };
}

export default function DashboardPage() {
  return <DashboardFeaturePage />;
}
