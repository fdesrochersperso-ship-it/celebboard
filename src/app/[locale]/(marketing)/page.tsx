import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/marketing/sections/hero";
import { LogoBar } from "@/components/marketing/sections/logo-bar";
import { Problem } from "@/components/marketing/sections/problem";
import { FeaturesGrid } from "@/components/marketing/sections/features-grid";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { Testimonials } from "@/components/marketing/sections/testimonials";
import { Verticals } from "@/components/marketing/sections/verticals";
import { PricingTeaser } from "@/components/marketing/sections/pricing-teaser";
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
    alternates: {
      canonical: locale === "en" ? "/" : "/fr",
      languages: { en: "/", fr: "/fr" },
    },
  };
}

const homeSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CelebBoard",
  applicationCategory: "BusinessApplication",
  description:
    "Team celebration software that automatically displays wins on office TVs with confetti, sounds, team photos, and live leaderboards.",
  operatingSystem: "Web browser",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "49",
    highPrice: "149",
    offerCount: "2",
  },
  author: {
    "@type": "Organization",
    name: "CelebBoard",
    url: "https://celebboard.com",
    foundingLocation: {
      "@type": "Place",
      name: "Montreal, Quebec, Canada",
    },
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <Hero />
      <LogoBar />
      <Problem />
      <FeaturesGrid />
      <HowItWorks />
      <Testimonials />
      <Verticals />
      <PricingTeaser />
      <Cta />
    </>
  );
}
