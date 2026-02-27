import { useTranslations } from "next-intl";
import {
  PartyPopper,
  Trophy,
  Zap,
  Users,
  Monitor,
  Palette,
} from "lucide-react";

const ICONS = [PartyPopper, Trophy, Zap, Users, Monitor, Palette];

export function FeaturesGrid() {
  const t = useTranslations("home.featuresGrid");

  const cards = t.raw("cards") as Array<{ title: string; description: string }>;

  return (
    <section className="bg-[#FAF9F7] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl">
        <p className="text-overline mb-4 text-center font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          What CelebBoard does
        </p>
        <h2 id="features-heading" className="text-h2 text-center text-[#111]">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#666]">
          {t("subtitle")}
        </p>
        {/* Edge-to-edge grid with dividers */}
        <div className="mt-16 grid grid-cols-1 border border-[#E7E5E4] md:grid-cols-3 md:grid-rows-2">
          {cards.map((card, i) => {
            const Icon = ICONS[i];
            return (
              <div
                key={i}
                className={`flex flex-col border-b border-[#E7E5E4] p-8 md:border-b-0 md:border-r ${
                  i === 2 || i === 5 ? "md:border-r-0" : ""
                } ${i >= 3 ? "md:border-b-0" : ""}`}
              >
                {Icon && (
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center bg-[#FEF3C7] text-[#B45309]">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                <h3 className="text-h3 text-[#111]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#666]">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
