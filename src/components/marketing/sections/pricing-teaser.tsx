import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function PricingTeaser() {
  const t = useTranslations("home.pricingTeaser");

  return (
    <section
      className="bg-[#FAF9F7] px-6 py-16 lg:px-12 lg:py-20"
      aria-labelledby="pricing-teaser-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="pricing-teaser-heading" className="text-h2 text-[#111]">
          {t("title")}
        </h2>
        <p className="mt-4 text-base text-[#666]">{t("subtitle")}</p>
        <Link
          href="/pricing"
          className="mt-6 inline-flex h-12 items-center justify-center bg-[#F59E0B] px-6 py-3 text-[15px] font-semibold text-[#0F172A] transition-colors hover:bg-[#D97706]"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
