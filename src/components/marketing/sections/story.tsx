import { useTranslations } from "next-intl";

export function Story() {
  const t = useTranslations("about.story");

  const paragraphs = t.raw("paragraphs") as string[];

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold">{t("title")}</h2>
        <div className="mt-8 space-y-6">
          {paragraphs.map((para, i) => (
            <p key={i} className="leading-relaxed text-muted-foreground">
              {para}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
