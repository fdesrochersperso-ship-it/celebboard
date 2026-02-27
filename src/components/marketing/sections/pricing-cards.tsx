import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

const PLAN_KEYS = ["starter", "growth", "enterprise"] as const;

export function PricingCards() {
  const t = useTranslations("pricing.plans");

  return (
    <section className="px-4 py-24">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
        {PLAN_KEYS.map((planKey, index) => {
          const features = t.raw(`${planKey}.features`) as string[];
          const badge = planKey === "growth" ? t(`${planKey}.badge`) : null;
          const isGrowth = planKey === "growth";

          return (
            <div
              key={planKey}
              className={`relative rounded-xl border p-6 ${
                isGrowth
                  ? "border-2 border-primary bg-primary/5 shadow-lg"
                  : "border-border"
              }`}
            >
              {badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                  {badge}
                </span>
              )}
              <h3 className="text-lg font-semibold">{t(`${planKey}.name`)}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{t(`${planKey}.price`)}</span>
                <span className="text-muted-foreground">{t(`${planKey}.period`)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`${planKey}.annualPrice`)}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                {t(`${planKey}.description`)}
              </p>
              <ul className="mt-6 space-y-3">
                {features.map((_, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{features[i]}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={planKey === "enterprise" ? "/signup?plan=demo" : "/signup"}
                className={`mt-8 block w-full rounded-lg py-3 text-center font-medium transition-colors ${
                  isGrowth
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border hover:bg-muted"
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
