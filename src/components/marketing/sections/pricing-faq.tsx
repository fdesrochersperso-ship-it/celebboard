"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function PricingFaq() {
  const t = useTranslations("pricing.faq");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = t.raw("items") as Array<{
    question: string;
    answer: string;
  }>;

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-bold">{t("title")}</h2>
        <div className="mt-12 space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-border"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-4 py-4 text-left font-medium transition-colors hover:bg-muted/50"
              >
                {item.question}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="border-t border-border px-4 py-4 text-muted-foreground">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
