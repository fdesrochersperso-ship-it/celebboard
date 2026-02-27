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
    <section
      className="relative overflow-hidden bg-[#0A0A0A] px-6 py-24 lg:px-12 lg:py-32"
      aria-labelledby="cta-heading"
    >
      {/* Ambient amber glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-[30%] h-[60%] w-full -translate-x-1/2"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, rgba(245,158,11,0.08), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Your team&apos;s next win
        </p>
        <h2 id="cta-heading" className="text-h2 text-[#FAFAFA]">
          {t("title")}
        </h2>
        <div className="mkt-heading-rule mx-auto mt-6" />
        <p className="mt-6 text-sm text-[#888]">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-14 w-fit items-center justify-center bg-[#F59E0B] px-8 py-4 text-base font-bold text-[#0F172A] shadow-[0_4px_16px_rgba(245,158,11,0.2)] transition-all hover:translate-y-[-1px] hover:bg-[#D97706]"
          >
            {t("cta")}
          </Link>
          {showSecondary && (
            <Link
              href="/features"
              className="inline-flex h-14 w-fit items-center justify-center border border-white/[0.15] px-8 py-4 text-base font-medium text-[#FAFAFA] transition-colors hover:border-white/30"
            >
              {t("ctaSecondary")} →
            </Link>
          )}
        </div>
        {showNoCard && (
          <p className="mt-6 text-sm text-[#555]">{t("noCard")}</p>
        )}
      </div>
    </section>
  );
}
