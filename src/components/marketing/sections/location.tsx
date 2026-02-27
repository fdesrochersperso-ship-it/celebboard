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
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold">{t("title")}</h2>
        <p className="mt-6 text-muted-foreground">{t("description")}</p>
        <button
          type="button"
          onClick={switchLocale}
          className="mt-6 text-primary underline hover:no-underline"
        >
          {t("cta")}
        </button>
      </div>
    </section>
  );
}
