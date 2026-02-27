import { useTranslations } from "next-intl";

export function HowItWorks() {
  const t = useTranslations("home.howItWorks");

  const steps = t.raw("steps") as Array<{
    number: string;
    title: string;
    description: string;
  }>;

  return (
    <section className="bg-[#FAF9F7] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="how-heading">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-0">
        {/* Image placeholder — 60% */}
        <div className="flex items-center justify-center bg-[#F5F5F4] lg:col-span-3">
          <div className="h-64 w-full max-w-xl border border-[#E7E5E4] bg-white p-8 lg:h-80">
            <p className="text-center text-sm text-[#A8A29E]">Dashboard view</p>
          </div>
        </div>
        {/* Text — 40% */}
        <div className="flex flex-col justify-center border-t border-[#E7E5E4] pl-0 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-12">
          <p className="text-overline mb-4 font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
            How it works
          </p>
          <h2 id="how-heading" className="text-h2 text-[#111]">
            {t("title")}
          </h2>
          <div className="mt-8 space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#FEF3C7] text-sm font-bold text-[#B45309]">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-h3 text-[#111]">{step.title}</h3>
                  <p className="mt-1 text-sm text-[#666]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
