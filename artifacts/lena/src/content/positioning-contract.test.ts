import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const PUBLIC_POSITIONING_FILES = [
  "src/content/site-copy.ts",
  "src/content/seo.ts",
  "src/lib/seo.ts",
  "src/config/site.ts",
  "src/layouts/PublicFooter.tsx",
  "src/components/LenaCta.tsx",
  "src/features/home/DigitalHouseOrbit.tsx",
  "src/features/home/ProcessSection.tsx",
  "index.html",
];

describe("LENA public positioning contract", () => {
  it("positions LENA around operating systems for real businesses", () => {
    const combined = PUBLIC_POSITIONING_FILES.map(read).join("\n");

    expect(combined).toContain("OPERATING SYSTEMS");
    expect(combined).toContain("Operating Systems for Real Businesses");
    expect(combined).toContain("أنظمة تشغيل للأعمال الحقيقية");
  });

  it("does not regress to the old creative-agency promise on public surfaces", () => {
    const combined = PUBLIC_POSITIONING_FILES.map(read).join("\n");

    expect(combined).not.toMatch(/CREATIVE SYSTEMS & EXPERIENCES/i);
    expect(combined).not.toMatch(/We create digital presence/i);
    expect(combined).not.toMatch(/Everything a digital presence needs/i);
    expect(combined).not.toMatch(/Have an idea that deserves a stronger presence/i);
    expect(combined).not.toMatch(/creative digital house/i);
    expect(combined).not.toMatch(/strategy, design, content, websites/i);
    expect(combined).not.toMatch(/complete digital experience/i);
    expect(combined).not.toMatch(/نصنع حضورًا رقميًا/);
    expect(combined).not.toMatch(/كل ما يحتاجه الحضور الرقمي/);
    expect(combined).not.toMatch(/بيت الحلول الرقمية الإبداعية/);
    expect(combined).not.toMatch(/بيت للحلول الرقمية الإبداعية/);
    expect(combined).not.toMatch(/تجربة رقمية متكاملة/);
  });

  it("renders the canonical footer promise instead of a second slogan", () => {
    const footer = read("src/layouts/PublicFooter.tsx");
    const structured = read("src/lib/seo.ts");

    expect(footer).toContain("useSiteCopy");
    expect(footer).toContain("copy.footer.description");
    expect(structured).toContain("SITE_COPY[locale].footer.description");
  });

  it("keeps the public process operations-first", () => {
    const process = read("src/features/home/ProcessSection.tsx");

    expect(process).toContain("Understand the real workflow");
    expect(process).toContain("Map entities, rules, and friction");
    expect(process).toContain("Build the operating system around daily work");
  });
});
