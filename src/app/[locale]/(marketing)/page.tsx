import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/marketing/sections/hero";
import { LogoBar } from "@/components/marketing/sections/logo-bar";
import { Problem } from "@/components/marketing/sections/problem";
import { FeaturesGrid } from "@/components/marketing/sections/features-grid";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { Testimonials } from "@/components/marketing/sections/testimonials";
import { Verticals } from "@/components/marketing/sections/verticals";
import { Cta } from "@/components/marketing/sections/cta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoBar />
      <Problem />
      <FeaturesGrid />
      <HowItWorks />
      <Testimonials />
      <Verticals />
      <Cta />
    </>
  );
}
