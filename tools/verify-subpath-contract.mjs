import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL  ${name}\n        ${e.message}`);
  }
};

const vercel = JSON.parse(readFileSync(resolve(ROOT, "vercel.json"), "utf8"));
const sources = vercel.rewrites.map((rule) => rule.source);

console.log("\n== Platform Vercel rewrites expose /lena without colliding with /api ==");
check("/lena/api is rewritten to the API function before the SPA fallback", () => {
  const api = sources.indexOf("/lena/api/:path*");
  const spa = sources.indexOf("/lena/:path*");
  const catchAll = sources.indexOf("/(.*)");
  assert.ok(api >= 0, "missing /lena/api/:path* rewrite");
  assert.ok(spa >= 0, "missing /lena/:path* rewrite");
  assert.ok(api < spa, "/lena/api must win over /lena SPA");
  assert.ok(spa < catchAll, "/lena SPA must win over the root catch-all");
});
check("/lena/assets maps onto the Vite asset directory", () => {
  const rule = vercel.rewrites.find((item) => item.source === "/lena/assets/:path*");
  assert.equal(rule?.destination, "/assets/:path*");
});
check("public files are reachable under /lena", () => {
  for (const file of ["favicon.svg", "lena-og.jpg", "founder.jpg", "robots.txt", "sitemap.xml"]) {
    const rule = vercel.rewrites.find((item) => item.source === `/lena/${file}`);
    assert.equal(rule?.destination, `/${file}`, file);
  }
});
check("root /api remains available for a standalone origin", () => {
  assert.ok(sources.includes("/api/:path*"));
});

const oauth = readFileSync(resolve(ROOT, "artifacts/api-server/src/auth/oauth.ts"), "utf8");
console.log("\n== admin cookies and OAuth cannot leak onto the MALEK origin ==");
check("session cookies are scoped to cookiePath()", () => {
  assert.match(oauth, /path:\s*cookiePath\(\)/);
  assert.doesNotMatch(oauth, /path:\s*"\/"/);
});
check("OAuth callback URI includes the deployment base path", () => {
  assert.match(oauth, /withBase\("\/api\/oauth\/callback"\)/);
});
check("OAuth next-path sanitiser strips base and locale before allowing /dashboard", () => {
  assert.match(oauth, /stripLocaleSegment/);
  assert.match(oauth, /never bounce a signed-in owner onto the host application's routes/);
});
check("OAuth error redirects stay inside the LENA namespace", () => {
  assert.match(oauth, /loginErrorPath\(/);
  assert.doesNotMatch(oauth, /redirect\("\/login\?error=/);
});

const app = readFileSync(resolve(ROOT, "artifacts/jiwdah/src/App.tsx"), "utf8");
console.log("\n== public company routes stay public; admin stays behind /login ==");
check("company-public routes are registered", () => {
  for (const path of ["/services", "/portfolio", "/about", "/ai-solutions", "/contact", "/help", "/privacy", "/work/:projectId"]) {
    assert.ok(app.includes(`path="${path}"`), path);
  }
});
check("admin surfaces remain explicit routes, not anonymous defaults", () => {
  assert.ok(app.includes('path="/dashboard"'));
  assert.ok(app.includes('path="/dashboard/projects-editor"'));
  assert.ok(app.includes('path="/login"'));
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
