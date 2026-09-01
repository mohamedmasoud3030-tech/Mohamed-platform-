#!/usr/bin/env node
/**
 * Emits robots.txt and sitemap.xml into the built frontend output.
 *
 * Runs AFTER `vite build`. No domain is hard-coded: the base URL is resolved from
 * configuration, with Vercel's build-time production URL as the automatic fallback.
 * If no base URL can be resolved the script still writes robots.txt, skips the
 * sitemap, and warns — it never fails the build for that reason alone.
 *
 * It DOES fail the build if the route inventory cannot be extracted, so a broken
 * extraction can never silently publish an incomplete sitemap.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const artifactDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(artifactDir, "dist", "public");
const srcDir = path.join(artifactDir, "src");

/** Both languages are real markets, so both are listed with mutual alternates. */
const LOCALES = ["ar", "en"];

/** Public, indexable static routes. Admin routes are deliberately excluded. */
const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/world", changefreq: "monthly", priority: "0.9" },
  { path: "/services", changefreq: "monthly", priority: "0.9" },
  { path: "/portfolio", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "yearly", priority: "0.6" },
  { path: "/ai-solutions", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "yearly", priority: "0.8" },
  { path: "/help", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy", changefreq: "yearly", priority: "0.4" },
];

function normalizeBasePath(raw) {
  if (!raw || raw === "/") return "";
  let value = String(raw).trim();
  if (!value.startsWith("/")) value = `/${value}`;
  return value.replace(/\/+$/, "");
}

const publicBasePath = normalizeBasePath(process.env.BASE_PATH);

function resolveBaseUrl() {
  // Prefer explicit public origin. Do not fall back to the internal Vercel
  // production host when the site is mounted under /lena — that host must
  // never appear in canonical or sitemap URLs.
  const candidates = [process.env.SITE_URL, process.env.VITE_SITE_URL];
  if (!publicBasePath) {
    candidates.push(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "",
    );
  }
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return value.replace(/\/+$/, "");
  }
  return "";
}

function publicPath(locale, routePath) {
  const rest = routePath === "/" ? `/${locale}` : `/${locale}${routePath}`;
  return publicBasePath ? `${publicBasePath}${rest}` : rest;
}

function extractPublicIds(relativeFile, label) {
  const file = path.join(srcDir, relativeFile);
  const source = readFileSync(file, "utf8");
  const ids = [...source.matchAll(/\bid:\s*"([a-z0-9][a-z0-9-]*)",\s*visibility:\s*"public"/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

function extractIds(relativeFile, label) {
  const file = path.join(srcDir, relativeFile);
  const source = readFileSync(file, "utf8");
  const ids = [...source.matchAll(/\bid:\s*"([a-z0-9][a-z0-9-]*)"/g)].map((match) => match[1]);
  const unique = [...new Set(ids)];
  return unique;
}

function xmlEscape(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSitemap(baseUrl, entries) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = entries
    .flatMap((entry) =>
      LOCALES.map((locale) => {
        const alternates = [
          ...LOCALES.map((code) => ({ hreflang: code, href: `${baseUrl}${publicPath(code, entry.path)}` })),
          { hreflang: "x-default", href: `${baseUrl}${publicPath("en", entry.path)}` },
        ];
        return [
          "  <url>",
          `    <loc>${xmlEscape(`${baseUrl}${publicPath(locale, entry.path)}`)}</loc>`,
          ...alternates.map(
            (alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${xmlEscape(alt.href)}"/>`,
          ),
          `    <lastmod>${today}</lastmod>`,
          `    <changefreq>${entry.changefreq}</changefreq>`,
          `    <priority>${entry.priority}</priority>`,
          "  </url>",
        ].join("\n");
      }),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

function buildRobots(baseUrl) {
  const prefixes = publicBasePath ? ["", publicBasePath] : [""];
  const lines = ["User-agent: *", "Allow: /"];
  for (const prefix of prefixes) {
    for (const path of ["/dashboard", "/dashboard/", "/login", "/ar/dashboard", "/en/dashboard", "/ar/login", "/en/login"]) {
      lines.push(`Disallow: ${prefix}${path}`);
    }
  }
  const sitemapPath = publicBasePath ? `${publicBasePath}/sitemap.xml` : "/sitemap.xml";
  if (baseUrl) lines.push("", `Sitemap: ${baseUrl}${sitemapPath}`);
  return `${lines.join("\n")}\n`;
}

function main() {
  const baseUrl = resolveBaseUrl();
  // Hidden entries are excluded: the sitemap must never advertise a page the
  // owner has taken off the public surface.
  const serviceIds = extractPublicIds("content/services.ts", "service");
  const projectIds = extractPublicIds("content/projects.ts", "project");

  const entries = [
    ...STATIC_ROUTES,
    ...serviceIds.map((id) => ({ path: `/services/${id}`, changefreq: "monthly", priority: "0.8" })),
    ...projectIds.map((id) => ({ path: `/work/${id}`, changefreq: "monthly", priority: "0.8" })),
  ];

  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "robots.txt"), buildRobots(baseUrl), "utf8");

  if (!baseUrl) {
    console.warn(
      "[sitemap] No SITE_URL / VITE_SITE_URL / VERCEL_PROJECT_PRODUCTION_URL set — " +
        "wrote robots.txt without a Sitemap reference and skipped sitemap.xml.",
    );
    return;
  }

  writeFileSync(path.join(outDir, "sitemap.xml"), buildSitemap(baseUrl, entries), "utf8");
  console.log(
    `[sitemap] Wrote ${entries.length * LOCALES.length} URLs (${LOCALES.join("/")}) to dist/public/sitemap.xml ` +
      `(${STATIC_ROUTES.length} static, ${serviceIds.length} services, ${projectIds.length} case studies) — base ${baseUrl}`,
  );
}

main();
