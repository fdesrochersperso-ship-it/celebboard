"use client";

import { useEffect } from "react";

/**
 * Sets data-theme="dark" on the document root when the marketing layout mounts.
 * This ensures Lovable design tokens apply to marketing pages.
 */
export function MarketingThemeInit() {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);
  return null;
}
