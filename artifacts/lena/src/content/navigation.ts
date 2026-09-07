/**
 * Public route inventory — simplified.
 * Only pages the visitor actually needs.
 */
export const PUBLIC_NAVIGATION = [
  { to: "/", copyKey: "home" },
  { to: "/services", copyKey: "services" },
  { to: "/portfolio", copyKey: "portfolio" },
  { to: "/about", copyKey: "about" },
  { to: "/contact", copyKey: "contact" },
] as const;

export type PublicNavCopyKey = (typeof PUBLIC_NAVIGATION)[number]["copyKey"];
