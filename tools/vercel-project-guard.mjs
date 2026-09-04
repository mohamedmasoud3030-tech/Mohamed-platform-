const EXPECTED_PROJECT_ID = "prj_rtqhzCOdiPlf7yOPAjGvAhhwN6nF";

const actualProjectId = process.env.VERCEL_PROJECT_ID;

if (!actualProjectId) {
  console.log("[vercel-project-guard] VERCEL_PROJECT_ID unavailable; continuing deployment.");
  process.exit(1);
}

if (actualProjectId !== EXPECTED_PROJECT_ID) {
  console.log("[vercel-project-guard] Ignoring deployment: repository is not running in canonical LENA project.");
  process.exit(0);
}

console.log("[vercel-project-guard] Canonical LENA project verified; continuing deployment.");
process.exit(1);
