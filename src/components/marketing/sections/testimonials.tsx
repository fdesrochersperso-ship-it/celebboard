import { useTranslations } from "next-intl";

export function Testimonials() {
  const t = useTranslations("home.testimonials");

  const items = t.raw("items") as Array<{
    quote: string;
    author: string;
    company: string;
    role: string;
  }>;

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{t("title")}</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-muted/30 p-6"
            >
              <blockquote className="text-lg leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <footer className="mt-4">
                <p className="font-semibold">{item.author}</p>
                <p className="text-sm text-muted-foreground">
                  {item.role}, {item.company}
                </p>
              </footer>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
