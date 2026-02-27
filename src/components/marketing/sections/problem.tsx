import { useTranslations } from "next-intl";

export function Problem() {
  const t = useTranslations("home.problem");

  const beforeItems = t.raw("before.items") as string[];
  const afterItems = t.raw("after.items") as string[];

  return (
    <section className="bg-[#FAF9F7] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-7xl">
        <p className="text-overline mb-4 text-center font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Before & after
        </p>
        <h2 id="problem-heading" className="text-h2 text-center text-[#111]">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-[#666]">
          {t("subtitle")}
        </p>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <div className="border border-[#E7E5E4] bg-[#F5F5F4] p-8">
            <h3 className="text-h3 text-[#B91C1C]">{t("before.label")}</h3>
            <ul className="mt-6 space-y-3">
              {beforeItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-[#666]">
                  <span className="text-[#B91C1C]">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-2 border-[#F59E0B]/30 bg-[#FEF3C7]/30 p-8">
            <h3 className="text-h3 text-[#B45309]">{t("after.label")}</h3>
            <ul className="mt-6 space-y-3">
              {afterItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-[#666]">
                  <span className="text-[#22C55E]">✓</span>
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
