import { getTranslations } from "next-intl/server";
import { FeaturesHero } from "@/components/marketing/sections/features-hero";
import { CelebrationEngine } from "@/components/marketing/sections/celebration-engine";
import { IntegrationsDetail } from "@/components/marketing/sections/integrations-detail";
import { DashboardFeatures } from "@/components/marketing/sections/dashboard-features";
import { AdminFeatures } from "@/components/marketing/sections/admin-features";
import { Cta } from "@/components/marketing/sections/cta";

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
  };
}

export default function FeaturesPage() {
  return (
    <>
      <FeaturesHero />
      <CelebrationEngine />
      <IntegrationsDetail />
      <DashboardFeatures />
      <AdminFeatures />
      <Cta namespace="features.cta" />
    </>
  );
}
