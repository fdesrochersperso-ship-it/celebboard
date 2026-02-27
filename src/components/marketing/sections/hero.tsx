import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section
      className="relative overflow-hidden bg-[#0A0A0A] pt-28 pb-20 lg:pt-40 lg:pb-24"
      aria-labelledby="hero-heading"
    >
      {/* Texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%)
          `,
          backgroundSize: "20px 20px",
        }}
      />
      {/* Warm glow */}
      <div
        className="pointer-events-none absolute right-0 top-[40%] h-[80%] w-[60%] opacity-20"
        style={{
          background: "radial-gradient(ellipse at 80% 50%, rgba(245,158,11,0.2), transparent 60%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-5 lg:gap-0 lg:px-12">
        {/* Text column — 60% on desktop */}
        <div className="flex flex-col justify-center lg:col-span-3">
          <p
            id="hero-overline"
            className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]"
          >
            Real wins. Real energy.
          </p>
          <h1
            id="hero-heading"
            className="text-hero text-[#FAFAFA]"
          >
            {t("title")}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#888]">
            {t("subtitle")}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 w-fit items-center justify-center bg-[#F59E0B] px-7 py-3.5 text-[15px] font-semibold text-[#0F172A] shadow-[0_4px_16px_rgba(245,158,11,0.2)] transition-all hover:translate-y-[-1px] hover:bg-[#D97706]"
            >
              {t("cta")}
            </Link>
            <Link
              href="/features"
              className="inline-flex h-12 w-fit items-center justify-center border border-white/[0.15] px-7 py-3.5 text-[15px] font-medium text-[#FAFAFA] transition-colors hover:border-white/30"
            >
              {t("ctaSecondary")} →
            </Link>
          </div>
          <p className="mt-6 text-sm text-[#555]">
            {t("noCard")}
          </p>
        </div>

        {/* TV mockup placeholder — 40% on desktop */}
        <div className="flex items-center justify-center lg:col-span-2">
          <div
            className="relative h-[280px] w-full max-w-md border-2 border-white/[0.08] bg-[#161616] lg:h-[320px]"
            aria-hidden
          >
            <div className="absolute inset-4 flex items-center justify-center bg-[#222]">
              <div className="text-center">
                <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-[#F59E0B]/20" />
                <p className="text-xs text-[#555]">Dashboard view</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
