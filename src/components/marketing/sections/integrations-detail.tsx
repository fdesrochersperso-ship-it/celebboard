import { useTranslations } from "next-intl";

export function IntegrationsDetail() {
  const t = useTranslations("features.integrations");

  const cards = t.raw("cards") as Array<{
    name: string;
    description: string;
  }>;

  return (
    <section className="bg-[#F5F5F4] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="integrations-heading">
      <div className="mx-auto max-w-7xl">
        <p className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Integrations
        </p>
        <h2 id="integrations-heading" className="text-h2 text-[#111]">
          {t("title")}
        </h2>
        <p className="mt-4 max-w-2xl text-base text-[#666]">
          {t("subtitle")}
        </p>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`border p-6 ${
                i === cards.length - 1
                  ? "border-dashed border-[#A8A29E] bg-[#F5F5F4]/50"
                  : "border-[#E7E5E4] bg-[#FAF9F7]"
              }`}
            >
              <h3 className="text-h3 text-[#111]">{card.name}</h3>
              <p className="mt-2 text-sm text-[#666]">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
