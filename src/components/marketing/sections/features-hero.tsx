import { useTranslations } from "next-intl";

export function FeaturesHero() {
  const t = useTranslations("features.hero");

  return (
    <section className="bg-[#0A0A0A] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="features-page-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Everything your team screen should be
        </p>
        <h1 id="features-page-heading" className="text-h1 text-[#FAFAFA]">
          {t("title")}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-[#888]">
          {t("subtitle")}
        </p>
      </div>
    </section>
  );
}
