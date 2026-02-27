import { useTranslations } from "next-intl";
import {
  PartyPopper,
  Trophy,
  Zap,
  Users,
  Monitor,
  Palette,
} from "lucide-react";

const ICONS = [
  PartyPopper,
  Trophy,
  Zap,
  Users,
  Monitor,
  Palette,
];

export function FeaturesGrid() {
  const t = useTranslations("home.featuresGrid");

  const cards = t.raw("cards") as Array<{ title: string; description: string }>;

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{t("title")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => {
            const Icon = ICONS[i];
            return (
              <div
                key={i}
                className="rounded-xl border border-border p-6"
              >
                {Icon && (
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                )}
                <h3 className="font-semibold">{card.title}</h3>
                <p className="mt-2 text-muted-foreground">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
