/** Maps initials (JD, SM, AK, LR, MP) to employee photo paths */
export const EMPLOYEE_PHOTOS: Record<string, string> = {
  JD: "/images/employees/employee2.jpg",
  SM: "/images/employees/employee3.avif",
  AK: "/images/employees/employee4.jpeg",
  LR: "/images/employees/employee5.jpg",
  MP: "/images/employees/employee7.jpg",
};

/** Logo paths for integrations (HubSpot, Slack, GA4, Spotify) */
export const INTEGRATION_LOGOS = {
  hubspot: "/images/logos/hubspot.png",
  slack: "/images/logos/slack.png",
  ga4: "/images/logos/ga4.svg",
  "google-analytics": "/images/logos/ga4.svg",
  spotify: "/images/logos/spotify.png",
} as const;
