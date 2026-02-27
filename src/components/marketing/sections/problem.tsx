import { useTranslations } from "next-intl";

export function Problem() {
  const t = useTranslations("home.problem");

  const beforeItems = t.raw("before.items") as string[];
  const afterItems = t.raw("after.items") as string[];

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{t("title")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-12 grid gap-12 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-8">
            <h3 className="text-lg font-semibold text-destructive">
              {t("before.label")}
            </h3>
            <ul className="mt-6 space-y-3">
              {beforeItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-muted-foreground">
                  <span className="text-destructive">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-primary/50 bg-primary/5 p-8">
            <h3 className="text-lg font-semibold text-primary">
              {t("after.label")}
            </h3>
            <ul className="mt-6 space-y-3">
              {afterItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-muted-foreground">
                  <span className="text-primary">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
