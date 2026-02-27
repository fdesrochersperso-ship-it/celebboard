import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

const PLAN_KEYS = ["starter", "growth", "enterprise"] as const;

export function PricingCards() {
  const t = useTranslations("pricing.plans");

  return (
    <section className="bg-white px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="plans-heading">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        {PLAN_KEYS.map((planKey, index) => {
          const features = t.raw(`${planKey}.features`) as string[];
          const badge = planKey === "growth" ? t(`${planKey}.badge`) : null;
          const isGrowth = planKey === "growth";

          return (
            <div
              key={planKey}
              className={`relative border bg-white p-8 ${
                isGrowth
                  ? "border-[#F59E0B] border-t-[3px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                  : "border-[#E7E5E4] border-t-[3px]"
              }`}
            >
              {badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F59E0B] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                  {badge}
                </span>
              )}
              <h3 className="text-h3 text-[#111]">{t(`${planKey}.name`)}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-display-num text-[#111]">{t(`${planKey}.price`)}</span>
                <span className="text-[#666]">{t(`${planKey}.period`)}</span>
              </div>
              <p className="mt-2 text-sm text-[#666]">
                {t(`${planKey}.annualPrice`)}
              </p>
              <p className="mt-4 text-sm text-[#666]">
                {t(`${planKey}.description`)}
              </p>
              <ul className="mt-8 space-y-3">
                {features.map((_, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#111]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-[#F59E0B] text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{features[i]}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={planKey === "enterprise" ? "/signup?plan=demo" : "/signup"}
                className={`mt-8 flex h-12 w-full items-center justify-center text-sm font-semibold transition-all ${
                  isGrowth
                    ? "bg-[#F59E0B] text-[#0F172A] hover:translate-y-[-1px] hover:bg-[#D97706]"
                    : "border border-[#E7E5E4] text-[#111] hover:border-[#D6D3D1] hover:bg-[#F5F5F4]"
                }`}
              >
                {t(`${planKey}.cta`)}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
