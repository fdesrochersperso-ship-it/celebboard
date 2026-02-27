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
    <section className="bg-[#FAF9F7] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl">
        <p className="text-overline mb-4 text-center font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          What teams are saying
        </p>
        <h2 id="testimonials-heading" className="text-h2 text-center text-[#111]">
          {t("title")}
        </h2>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="border-l-[3px] border-[#F59E0B] bg-[#FAF9F7] p-8"
            >
              <blockquote className="text-lg leading-relaxed text-[#111]">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <footer className="mt-6">
                <p className="font-semibold text-[#111]">{item.author}</p>
                <p className="text-sm text-[#666]">
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
