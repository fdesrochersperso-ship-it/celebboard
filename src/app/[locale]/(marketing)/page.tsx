import { getTranslations } from "next-intl/server";
import { HomeLovable } from "@/components/marketing/sections/home-lovable";

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
      <HomeLovable />
    </>
  );
}
