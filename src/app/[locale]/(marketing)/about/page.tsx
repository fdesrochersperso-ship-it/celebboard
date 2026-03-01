import { getTranslations } from "next-intl/server";
import { AboutHero } from "@/components/marketing/sections/about-hero";
import { Story } from "@/components/marketing/sections/story";
import { Values } from "@/components/marketing/sections/values";
import { Location } from "@/components/marketing/sections/location";
import { Cta } from "@/components/marketing/sections/cta";

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CelebBoard",
  url: "https://celebboard.com",
  description:
    "CelebBoard was born from a simple observation: teams that see their wins together, win more together.",
  foundingLocation: {
    "@type": "Place",
    name: "Montreal, Quebec, Canada",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.about" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/about" : "/fr/about",
      languages: { en: "/about", fr: "/fr/about" },
    },
  };
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <AboutHero />
      <Story />
      <Values />
      <Location />
      <Cta namespace="about.cta" />
    </>
  );
}
