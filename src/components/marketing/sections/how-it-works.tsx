import { useTranslations } from "next-intl";

export function HowItWorks() {
  const t = useTranslations("home.howItWorks");

  const steps = t.raw("steps") as Array<{
    number: string;
    title: string;
    description: string;
  }>;

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{t("title")}</h2>
        <div className="mt-12 flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-1 flex-col items-center text-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {step.number}
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 max-w-xs text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
