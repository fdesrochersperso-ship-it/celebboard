import { useTranslations } from "next-intl";

export function DashboardFeatures() {
  const t = useTranslations("features.dashboard");

  const features = t.raw("features") as Array<{
    title: string;
    description: string;
  }>;

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{t("title")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="rounded-xl border border-border p-6"
            >
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
