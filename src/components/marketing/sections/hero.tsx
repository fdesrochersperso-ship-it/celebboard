import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            {t("cta")}
          </Link>
          <Link
            href="/features"
            className="rounded-full border border-border px-8 py-3 font-medium transition-colors hover:bg-muted"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("noCard")}
        </p>
      </div>
    </section>
  );
}
