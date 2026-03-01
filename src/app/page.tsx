import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/sections/hero";
import { LogoBar } from "@/components/marketing/sections/logo-bar";
import { Problem } from "@/components/marketing/sections/problem";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { Testimonials } from "@/components/marketing/sections/testimonials";
import { Cta } from "@/components/marketing/sections/cta";

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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: "metadata.home",
  });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/",
      languages: { en: "/", fr: "/fr" },
    },
  };
}

export default async function RootPage() {
  const locale = routing.defaultLocale;
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <LogoBar />
          <Problem />
          <HowItWorks />
          <Testimonials />
          <Cta />
        </main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
