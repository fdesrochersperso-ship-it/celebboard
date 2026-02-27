"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

export function Location() {
  const t = useTranslations("about.location");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "en" ? "fr" : "en" });
  };

  return (
    <section className="bg-[#FAF9F7] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="location-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Montréal
        </p>
        <h2 id="location-heading" className="text-h2 text-[#111]">
          {t("title")}
        </h2>
        <p className="mt-6 text-base leading-relaxed text-[#666]">
          {t("description")}
        </p>
        <button
          type="button"
          onClick={switchLocale}
          className="mt-6 font-semibold text-[#F59E0B] underline decoration-[#F59E0B] underline-offset-4 hover:no-underline"
        >
          {t("cta")}
        </button>
      </div>
    </section>
  );
}
