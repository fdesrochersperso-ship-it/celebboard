import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type CtaNamespace =
  | "home.cta"
  | "features.cta"
  | "pricing.cta"
  | "about.cta";

interface CtaProps {
  namespace?: CtaNamespace;
}

export function Cta({ namespace = "home.cta" }: CtaProps) {
  const t = useTranslations(namespace);

  const showSecondary = namespace === "home.cta";
  const showNoCard = namespace === "home.cta";

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-muted/30 px-8 py-16 text-center">
        <h2 className="text-3xl font-bold">{t("title")}</h2>
        <p className="mt-4 text-muted-foreground">{t("subtitle")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            {t("cta")}
          </Link>
          {showSecondary && (
            <Link
              href="/features"
              className="rounded-full border border-border px-8 py-3 font-medium transition-colors hover:bg-muted"
            >
              {t("ctaSecondary")}
            </Link>
          )}
        </div>
        {showNoCard && (
          <p className="mt-6 text-sm text-muted-foreground">{t("noCard")}</p>
        )}
      </div>
    </section>
  );
}
