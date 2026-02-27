import { useTranslations } from "next-intl";

export function LogoBar() {
  const t = useTranslations("home.logoBar");

  return (
    <section className="border-y border-[#E7E5E4] bg-[#F5F5F4] py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <p className="text-center text-sm font-medium text-[#78716C]">
          {t("title")}
        </p>
      </div>
    </section>
  );
}
