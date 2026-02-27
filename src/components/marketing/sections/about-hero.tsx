import { useTranslations } from "next-intl";

export function AboutHero() {
  const t = useTranslations("about.hero");

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>
    </section>
  );
}
