import { useTranslations } from "next-intl";

export function PricingComparison() {
  const t = useTranslations("pricing.comparison");

  const headers = t.raw("headers") as string[];
  const rows = t.raw("rows") as Array<{
    label: string;
    values: string[];
  }>;

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{t("title")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse rounded-lg border border-border">
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th
                    key={i}
                    className={`border-b border-border px-4 py-3 text-left font-semibold ${
                      i === 1 ? "bg-primary/10 text-primary" : "bg-muted/30"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i < rows.length - 1 ? "border-b border-border" : ""}>
                  <td className="px-4 py-3 font-medium">{row.label}</td>
                  {row.values.map((value, j) => (
                    <td
                      key={j}
                      className={`px-4 py-3 ${j === 0 ? "bg-primary/5 font-medium" : ""}`}
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
