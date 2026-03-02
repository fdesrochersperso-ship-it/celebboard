"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("languageSwitcher");

  const toggle = () => {
    const next = locale === "en" ? "fr" : "en";
    router.replace(pathname, { locale: next });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("switchTo")}
      className="inline-flex h-9 items-center justify-center border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50"
    >
      {locale === "en" ? t("fr") : t("en")}
    </button>
  );
}
