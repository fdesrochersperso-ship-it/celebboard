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
    <header className="sticky top-0 z-50 h-14 w-full border-b border-white/[0.06] bg-[#0A0A0A]/90 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-base font-bold tracking-[0.15em] uppercase text-[#FAFAFA]"
        >
          CelebBoard
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/features"
            className="text-[13px] font-medium text-[#888] transition-colors hover:text-[#FAFAFA]"
          >
            {t("features")}
          </Link>
          <Link
            href="/pricing"
            className="text-[13px] font-medium text-[#888] transition-colors hover:text-[#FAFAFA]"
          >
            {t("pricing")}
          </Link>
          <Link
            href="/about"
            className="text-[13px] font-medium text-[#888] transition-colors hover:text-[#FAFAFA]"
          >
            {t("about")}
          </Link>
          <Link
            href="/blog"
            className="text-[13px] font-medium text-[#888] transition-colors hover:text-[#FAFAFA]"
          >
            {t("blog")}
          </Link>
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-[13px] font-medium text-[#888] transition-colors hover:text-[#FAFAFA]"
          >
            {t("login")}
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center bg-[#F59E0B] px-4 py-2 text-xs font-semibold text-[#0F172A] shadow-[0_4px_16px_rgba(245,158,11,0.2)] transition-all hover:translate-y-[-1px] hover:bg-[#D97706]"
          >
            {t("cta")}
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center text-[#FAFAFA] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? t("menuClose") : t("menuOpen")}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/[0.06] bg-[#0A0A0A] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/features"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center text-[13px] font-medium text-[#888] hover:text-[#FAFAFA]"
            >
              {t("features")}
            </Link>
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center text-[13px] font-medium text-[#888] hover:text-[#FAFAFA]"
            >
              {t("pricing")}
            </Link>
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center text-[13px] font-medium text-[#888] hover:text-[#FAFAFA]"
            >
              {t("about")}
            </Link>
            <Link
              href="/blog"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center text-[13px] font-medium text-[#888] hover:text-[#FAFAFA]"
            >
              {t("blog")}
            </Link>
            <div className="flex h-12 items-center">
              <LanguageSwitcher />
            </div>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center text-[13px] font-medium text-[#888] hover:text-[#FAFAFA]"
            >
              {t("login")}
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="mt-2 flex h-11 items-center justify-center bg-[#F59E0B] text-xs font-semibold text-[#0F172A]"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
