"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/celebrations", key: "celebrations" },
  { href: "/dashboard", key: "dashboard" },
  { href: "/engagement", key: "engagement" },
  { href: "/admin", key: "admin" },
  { href: "/pricing", key: "pricing" },
  { href: "/about", key: "about" },
  { href: "/blog", key: "blog" },
];

export function Navbar() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">CelebBoard</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">{t("login")}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app">{t("liveDemo")}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">{t("cta")}</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden p-2 text-foreground"
          onClick={() => setOpen(!open)}
          aria-label={open ? t("menuClose") : t("menuOpen")}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              {t(link.key)}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <div className="px-4 py-2">
              <LanguageSwitcher />
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login" onClick={() => setOpen(false)}>
                {t("login")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app" onClick={() => setOpen(false)}>
                {t("liveDemo")}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup" onClick={() => setOpen(false)}>
                {t("cta")}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
