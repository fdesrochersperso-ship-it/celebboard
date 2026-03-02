import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";

const featureLinks = [
  { href: "/celebrations", key: "celebrations" },
  { href: "/dashboard", key: "dashboard" },
  { href: "/engagement", key: "engagement" },
  { href: "/admin", key: "admin" },
];

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary/10 py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">CelebBoard</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">{t("tagline")}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
              {t("product")}
            </h4>
            <ul className="space-y-2">
              {featureLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tNav(link.key)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("productLinks.pricing")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
              {t("connect")}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  {t("companyLinks.about")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  {t("companyLinks.blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="hover:text-foreground transition-colors"
                >
                  {t("legalLinks.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  {t("legalLinks.privacy")}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@celebboard.com"
                  className="hover:text-foreground transition-colors"
                >
                  {t("companyLinks.contact")}
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/celebboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {t("connectLinks.twitter")}
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/company/celebboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {t("connectLinks.linkedin")}
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {year} CelebBoard. Built with ❤️ for teams that celebrate.
        </div>
      </div>
    </footer>
  );
}
