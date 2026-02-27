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
    <section className="bg-[#FAF9F7] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-2xl">
        <p className="text-overline mb-4 text-center font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          FAQ
        </p>
        <h2 id="faq-heading" className="text-h2 text-center text-[#111]">
          {t("title")}
        </h2>
        <div className="mt-16 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="border border-[#E7E5E4] bg-white">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold text-[#111] transition-colors hover:bg-[#F5F5F4]"
              >
                {item.question}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[#666] transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="border-t border-[#E7E5E4] px-6 py-4 text-sm text-[#666]">
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
