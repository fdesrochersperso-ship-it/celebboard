import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-[#0A0A0A] px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <Link
              href="/"
              className="text-base font-bold tracking-[0.15em] uppercase text-mkt-text-on-dark"
            >
              CelebBoard
            </Link>
            <p className="mt-3 text-sm text-[#888]">{t("tagline")}</p>
            <h3 className="mb-3 mt-8 font-semibold text-[#FAFAFA]">
              {t("product")}
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/features", key: "productLinks.features" },
                { href: "/pricing", key: "productLinks.pricing" },
                { href: "/features", key: "productLinks.integrations" },
                { href: "/blog", key: "productLinks.changelog" },
              ].map(({ href, key }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-[#888] transition-colors hover:text-mkt-text-on-dark"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-[#FAFAFA]">
              {t("company")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-[#888] transition-colors hover:text-mkt-text-on-dark"
                >
                  {t("companyLinks.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-[#888] transition-colors hover:text-mkt-text-on-dark"
                >
                  {t("companyLinks.blog")}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@celebboard.com"
                  className="text-sm text-[#888] transition-colors hover:text-mkt-text-on-dark"
                >
                  {t("companyLinks.contact")}
                </a>
              </li>
              <li>
                <a
                  href="mailto:careers@celebboard.com"
                  className="text-sm text-[#888] transition-colors hover:text-mkt-text-on-dark"
                >
                  {t("companyLinks.careers")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-[#FAFAFA]">
              {t("legal")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/legal/terms"
                  className="text-sm text-[#888] transition-colors hover:text-mkt-text-on-dark"
                >
                  {t("legalLinks.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-sm text-[#888] transition-colors hover:text-mkt-text-on-dark"
                >
                  {t("legalLinks.privacy")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-[#FAFAFA]">
              {t("connect")}
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://twitter.com/celebboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#888] transition-colors hover:text-mkt-text-on-dark"
                >
                  {t("connectLinks.twitter")}
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/company/celebboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#888] transition-colors hover:text-mkt-text-on-dark"
                >
                  {t("connectLinks.linkedin")}
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@celebboard.com"
                  className="text-sm text-[#888] transition-colors hover:text-mkt-text-on-dark"
                >
                  {t("connectLinks.email")}
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        <p className="mt-12 text-center text-sm text-[#888]">
          {t("copyright", { year })} · {t("builtIn")}
        </p>
      </div>
    </footer>
  );
}
