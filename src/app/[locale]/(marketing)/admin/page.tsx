import { getTranslations } from "next-intl/server";
import { AdminFeaturePage } from "@/components/marketing/sections/admin-feature-lovable";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.features" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/admin" : "/fr/admin",
      languages: { en: "/admin", fr: "/fr/admin" },
    },
  };
}

export default function AdminPage() {
  return <AdminFeaturePage />;
}
