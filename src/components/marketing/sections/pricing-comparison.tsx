import { useTranslations } from "next-intl";

export function PricingComparison() {
  const t = useTranslations("pricing.comparison");

  const headers = t.raw("headers") as string[];
  const rows = t.raw("rows") as Array<{
    label: string;
    values: string[];
  }>;

  return (
    <section className="bg-[#FAF9F7] px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="comparison-heading">
      <div className="mx-auto max-w-7xl">
        <p className="text-overline mb-4 text-center font-bold uppercase tracking-[0.2em] text-[#F59E0B]">
          Compare
        </p>
        <h2 id="comparison-heading" className="text-h2 text-center text-[#111]">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#666]">
          {t("subtitle")}
        </p>
        <div className="mt-16 overflow-x-auto">
          <table className="w-full border border-[#E7E5E4]">
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th
                    key={i}
                    className={`border-b border-[#E7E5E4] px-6 py-4 text-left text-sm font-semibold ${
                      i === 1 ? "bg-[#FEF3C7]/50 text-[#B45309]" : "bg-[#F5F5F4] text-[#111]"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i < rows.length - 1 ? "border-b border-[#E7E5E4]" : ""}>
                  <td className="px-6 py-4 font-medium text-[#111]">{row.label}</td>
                  {row.values.map((value, j) => (
                    <td
                      key={j}
                      className={`px-6 py-4 text-sm ${j === 0 ? "bg-[#FEF3C7]/30 font-medium" : "text-[#666]"}`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
