import { getTranslations } from "next-intl/server";
import { AboutHero } from "@/components/marketing/sections/about-hero";
import { Story } from "@/components/marketing/sections/story";
import { Values } from "@/components/marketing/sections/values";
import { Location } from "@/components/marketing/sections/location";
import { Cta } from "@/components/marketing/sections/cta";

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
  };
}

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <Story />
      <Values />
      <Location />
      <Cta namespace="about.cta" />
    </>
  );
}
