import { useTranslations } from "next-intl";
import {
  Heart,
  Zap,
  Users,
  Eye,
  Infinity,
  Globe,
} from "lucide-react";

const ICONS = [Heart, Zap, Users, Eye, Infinity, Globe];

export function Values() {
  const t = useTranslations("about.values");

  const items = t.raw("items") as Array<{
    title: string;
    description: string;
  }>;

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{t("title")}</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
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
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
