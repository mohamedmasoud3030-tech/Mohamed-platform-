/**
 * Public route inventory. Labels are owned by SITE_COPY.nav so header, footer
 * and page copy cannot drift into a second slogan set.
 */
export const PUBLIC_NAVIGATION = [
  { to: "/", copyKey: "home" },
  { to: "/services", copyKey: "services" },
  { to: "/portfolio", copyKey: "portfolio" },
  { to: "/about", copyKey: "about" },
  { to: "/ai-solutions", copyKey: "ai" },
  { to: "/contact", copyKey: "contact" },
] as const;

export type PublicNavCopyKey = (typeof PUBLIC_NAVIGATION)[number]["copyKey"];
