import { getTranslations } from "next-intl/server";
import { FeaturesHubPage } from "@/components/marketing/sections/features-hub";

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
      canonical: locale === "en" ? "/features" : "/fr/features",
      languages: { en: "/features", fr: "/fr/features" },
    },
  };
}

const featuresSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CelebBoard",
  applicationCategory: "BusinessApplication",
  description:
    "Team celebration software with automated celebrations, live leaderboards, KPI cards, team photos, content feed, and custom themes.",
  featureList: [
    "Automated celebrations with confetti and sounds",
    "Live leaderboards",
    "KPI cards",
    "Team photos in celebrations",
    "Content feed and rotation",
    "Themes and customization",
    "Works on any screen",
    "HubSpot, Slack, and webhook integrations",
  ],
  author: {
    "@type": "Organization",
    name: "CelebBoard",
    url: "https://celebboard.com",
  },
};

export default function FeaturesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featuresSchema) }}
      />
      <FeaturesHubPage />
    </>
  );
}
