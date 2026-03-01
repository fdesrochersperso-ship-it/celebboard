import { getTranslations } from "next-intl/server";
import { PricingHero } from "@/components/marketing/sections/pricing-hero";
import { PricingCards } from "@/components/marketing/sections/pricing-cards";
import { PricingFaq } from "@/components/marketing/sections/pricing-faq";
import { PricingComparison } from "@/components/marketing/sections/pricing-comparison";
import { Cta } from "@/components/marketing/sections/cta";

async function PricingSchema({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "pricing.faq" });
  const items = t.raw("items") as Array<{ question: string; answer: string }>;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CelebBoard",
    description: "Team celebration software for office TVs",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "49",
        priceCurrency: "USD",
        priceValidUntil: "2027-01-01",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Growth",
        price: "149",
        priceCurrency: "USD",
        priceValidUntil: "2027-01-01",
        availability: "https://schema.org/InStock",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

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
    alternates: {
      canonical: locale === "en" ? "/pricing" : "/fr/pricing",
      languages: { en: "/pricing", fr: "/fr/pricing" },
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <PricingSchema locale={locale} />
      <PricingHero />
      <PricingCards />
      <PricingComparison />
      <PricingFaq />
      <Cta namespace="pricing.cta" />
    </>
  );
}
