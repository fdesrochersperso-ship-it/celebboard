"use client";

import { INTEGRATION_LOGOS } from "@/lib/marketing-assets";

const LABELS: Record<keyof typeof INTEGRATION_LOGOS, string> = {
  hubspot: "HubSpot",
  slack: "Slack",
  ga4: "GA4",
  "google-analytics": "Google Analytics",
  spotify: "Spotify",
};

export type IntegrationName = keyof typeof INTEGRATION_LOGOS;

interface IntegrationLogoProps {
  name: IntegrationName;
  size?: number;
  className?: string;
}

/** Standalone logo image for HubSpot, Slack, GA4, Spotify */
export function IntegrationLogo({ name, size = 24, className = "" }: IntegrationLogoProps) {
  const src = INTEGRATION_LOGOS[name];
  const alt = LABELS[name];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block align-middle object-contain ${className}`}
    />
  );
}

interface IntegrationWithLogoProps {
  name: IntegrationName;
  label?: string;
  size?: number;
  className?: string;
}

/** Logo + text inline (e.g. "HubSpot" with logo) */
export function IntegrationWithLogo({
  name,
  label,
  size = 20,
  className = "",
}: IntegrationWithLogoProps) {
  const displayLabel = label ?? LABELS[name];
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <IntegrationLogo name={name} size={size} />
      <span>{displayLabel}</span>
    </span>
  );
}
