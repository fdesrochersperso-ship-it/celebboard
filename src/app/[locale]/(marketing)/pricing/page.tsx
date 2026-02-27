import { getTranslations } from "next-intl/server";
import { PricingHero } from "@/components/marketing/sections/pricing-hero";
import { PricingCards } from "@/components/marketing/sections/pricing-cards";
import { PricingFaq } from "@/components/marketing/sections/pricing-faq";
import { PricingComparison } from "@/components/marketing/sections/pricing-comparison";
import { Cta } from "@/components/marketing/sections/cta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.pricing" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function PricingPage() {
  return (
    <>
      <PricingHero />
      <PricingCards />
      <PricingComparison />
      <PricingFaq />
      <Cta namespace="pricing.cta" />
    </>
  );
}
