"use client";

import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          CelebBoard
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("features")}
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("pricing")}
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("about")}
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("blog")}
          </Link>
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("login")}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            {t("cta")}
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? t("menuClose") : t("menuOpen")}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/features" onClick={() => setOpen(false)}>
              {t("features")}
            </Link>
            <Link href="/pricing" onClick={() => setOpen(false)}>
              {t("pricing")}
            </Link>
            <Link href="/about" onClick={() => setOpen(false)}>
              {t("about")}
            </Link>
            <Link href="/blog" onClick={() => setOpen(false)}>
              {t("blog")}
            </Link>
            <LanguageSwitcher />
            <Link href="/login" onClick={() => setOpen(false)}>
              {t("login")}
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)}>
              {t("cta")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
