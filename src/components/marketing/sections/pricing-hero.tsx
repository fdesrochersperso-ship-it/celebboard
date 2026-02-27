import { useTranslations } from "next-intl";

export function PricingHero() {
  const t = useTranslations("pricing.hero");

  return (
    <section className="bg-[#FAF9F7] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Simple pricing
        </p>
        <h1 id="pricing-heading" className="text-h1 text-[#111]">
          {t("title")}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-[#666]">
          {t("subtitle")}
        </p>
      </div>
    </section>
  );
}
