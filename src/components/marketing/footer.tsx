import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="text-xl font-bold tracking-tight">
              CelebBoard
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
            <h3 className="mb-3 mt-6 font-semibold">{t("product")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/features"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("productLinks.features")}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("productLinks.pricing")}
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("productLinks.integrations")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("productLinks.changelog")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">{t("company")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("companyLinks.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("companyLinks.blog")}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@celebboard.com"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("companyLinks.contact")}
                </a>
              </li>
              <li>
                <a
                  href="mailto:careers@celebboard.com"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("companyLinks.careers")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">{t("legal")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/legal/terms"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("legalLinks.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("legalLinks.privacy")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">{t("connect")}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://twitter.com/celebboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("connectLinks.twitter")}
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/company/celebboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("connectLinks.linkedin")}
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@celebboard.com"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("connectLinks.email")}
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("copyright", { year })} · {t("builtIn")}
        </p>
      </div>
    </footer>
  );
}
