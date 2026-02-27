import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function Verticals() {
  const t = useTranslations("home.verticals");

  const cards = t.raw("cards") as Array<{
    title: string;
    description: string;
    link: string;
  }>;

  return (
    <section className="bg-[#F5F5F4] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="verticals-heading">
      <div className="mx-auto max-w-7xl">
        <p className="text-overline mb-4 text-center font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Built for any activity team
        </p>
        <h2 id="verticals-heading" className="text-h2 text-center text-[#111]">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#666]">
          {t("subtitle")}
        </p>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <Link
              key={i}
              href="/features"
              className="group border border-[#E7E5E4] bg-[#FAF9F7] p-6 transition-all hover:border-[#F59E0B]/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            >
              <h3 className="text-h3 text-[#111]">{card.title}</h3>
              <p className="mt-2 text-sm text-[#666]">{card.description}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#F59E0B] group-hover:translate-x-1 transition-transform">
                {card.link}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
