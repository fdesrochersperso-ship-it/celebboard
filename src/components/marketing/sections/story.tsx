import { useTranslations } from "next-intl";

export function Story() {
  const t = useTranslations("about.story");

  const paragraphs = t.raw("paragraphs") as string[];

  return (
    <section className="bg-[#FAF9F7] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="story-heading">
      <div className="mx-auto max-w-3xl">
        <p className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Origin
        </p>
        <h2 id="story-heading" className="text-h2 text-[#111]">
          {t("title")}
        </h2>
        <div className="mkt-heading-rule mt-6" />
        <div className="mt-8 space-y-6">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-base leading-relaxed text-[#666]">
              {para}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
