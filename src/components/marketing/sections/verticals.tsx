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
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{t("title")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <Link
              key={i}
              href="/features"
              className="rounded-xl border border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/30"
            >
              <h3 className="font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {card.description}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-primary">
                {card.link}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
