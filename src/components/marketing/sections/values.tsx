import { useTranslations } from "next-intl";
import { Heart, Zap, Users, Eye, Infinity, Globe } from "lucide-react";

const ICONS = [Heart, Zap, Users, Eye, Infinity, Globe];

export function Values() {
  const t = useTranslations("about.values");

  const items = t.raw("items") as Array<{
    title: string;
    description: string;
  }>;

  return (
    <section className="bg-[#F5F5F4] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="values-heading">
      <div className="mx-auto max-w-7xl">
        <p className="text-overline mb-4 text-center font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          What we stand for
        </p>
        <h2 id="values-heading" className="text-h2 text-center text-[#111]">
          {t("title")}
        </h2>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={i} className="border border-[#E7E5E4] bg-[#FAF9F7] p-6">
                {Icon && (
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center bg-[#FEF3C7] text-[#B45309]">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                <h3 className="text-h3 text-[#111]">{item.title}</h3>
                <p className="mt-2 text-sm text-[#666]">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
