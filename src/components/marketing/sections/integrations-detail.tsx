import { useTranslations } from "next-intl";

export function IntegrationsDetail() {
  const t = useTranslations("features.integrations");

  const cards = t.raw("cards") as Array<{
    name: string;
    description: string;
  }>;

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{t("title")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`rounded-xl border p-6 ${
                i === cards.length - 1
                  ? "border-dashed border-muted-foreground/30 bg-muted/20"
                  : "border-border"
              }`}
            >
              <h3 className="font-semibold">{card.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
