import { useTranslations } from "next-intl";

export function DashboardFeatures() {
  const t = useTranslations("features.dashboard");

  const features = t.raw("features") as Array<{
    title: string;
    description: string;
  }>;

  return (
    <section className="bg-[#FAF9F7] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="dashboard-heading">
      <div className="mx-auto max-w-7xl">
        <p className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          TV dashboard
        </p>
        <h2 id="dashboard-heading" className="text-h2 text-[#111]">
          {t("title")}
        </h2>
        <p className="mt-4 max-w-2xl text-base text-[#666]">
          {t("subtitle")}
        </p>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="border border-[#E7E5E4] bg-[#F5F5F4] p-6">
              <h3 className="text-h3 text-[#111]">{feature.title}</h3>
              <p className="mt-2 text-sm text-[#666]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
