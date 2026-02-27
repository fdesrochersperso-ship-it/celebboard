import { useTranslations } from "next-intl";

export function LogoBar() {
  const t = useTranslations("home.logoBar");

  return (
    <section className="border-y border-border bg-muted/30 py-8">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {t("title")}
        </p>
      </div>
    </section>
  );
}
