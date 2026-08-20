#!/usr/bin/env node
/**
 * Egress and AI-provider guard.
 *
 * This product deliberately has no AI features and exactly two outbound
 * integrations. The realistic risk is not a bad model choice — it is that a
 * future change quietly adds an AI provider or a new outbound call that ships
 * client inquiries to a third party with no review, no budget cap and no
 * disclosure.
 *
 * This check fails the build when that happens. It is not a security boundary;
 * it is a review trigger. To add a provider legitimately: update
 * AI_FEATURE_SYSTEM.md, then add it to the allowlist below in the same change.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

/** Declared outbound integrations. Every entry must be justified in AI_FEATURE_SYSTEM.md §2. */
const ALLOWED_HOSTS = [
  "KIMI_AUTH_URL", // OAuth provider — admin sign-in only
  "KIMI_OPEN_URL", // OAuth provider profile — admin sign-in only
  "SUPABASE_URL", // Object storage for project media — no personal data
  "wa.me", // WhatsApp deep link, opened by the user's own browser
  "schema.org", // Structured-data vocabulary URL, never requested at runtime
  "www.sitemaps.org", // XML namespace, never requested
  "www.w3.org", // XML namespace, never requested
  "openapi.vercel.sh", // JSON schema reference in vercel.json
];

/** No AI provider is approved for use. Adoption requires owner approval — see AI_FEATURE_SYSTEM.md §3. */
const AI_PACKAGE_PATTERN =
  /^(openai|anthropic|@anthropic-ai\/|@google\/generative-ai|@google\/genai|@mistralai\/|cohere-ai|replicate|langchain|@langchain\/|llamaindex|ollama|groq-sdk|@huggingface\/|ai)$/;

const AI_ENDPOINT_PATTERN =
  /(api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|api\.mistral\.ai|api\.cohere\.|api\.groq\.com|api-inference\.huggingface\.co|api\.replicate\.com)/i;

const SOURCE_DIRS = ["artifacts/api-server/src", "artifacts/jiwdah/src", "lib", "api"];
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "build", "coverage"]);

function walk(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry)) files.push(full);
  }
  return files;
}

const problems = [];

// 1) No AI SDK may appear in any package manifest.
for (const manifest of ["package.json", "artifacts/api-server/package.json", "artifacts/jiwdah/package.json", "artifacts/mockup-sandbox/package.json"]) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(path.join(ROOT, manifest), "utf8"));
  } catch {
    continue;
  }
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    for (const name of Object.keys(pkg[field] ?? {})) {
      if (AI_PACKAGE_PATTERN.test(name)) {
        problems.push(
          `${manifest}: dependency "${name}" is an AI provider SDK. No AI provider is approved. ` +
            `See AI_FEATURE_SYSTEM.md §3 before adding one.`,
        );
      }
    }
  }
}

// 2) No source file may call a known model endpoint.
// 3) No source file may reach a host that is not a declared integration.
for (const dir of SOURCE_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const source = readFileSync(file, "utf8");
    const relative = path.relative(ROOT, file);

    const endpoint = AI_ENDPOINT_PATTERN.exec(source);
    if (endpoint) {
      problems.push(`${relative}: calls the model endpoint "${endpoint[0]}" — undeclared AI usage.`);
    }

    for (const match of source.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
      const host = match[1].toLowerCase();
      // Loopback and documentation hosts are parsing bases or examples, never real egress.
      if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|example\.(com|org))$/.test(host)) continue;
      if (!ALLOWED_HOSTS.some((allowed) => host === allowed.toLowerCase() || host.endsWith(allowed.toLowerCase()))) {
        problems.push(`${relative}: outbound host "${host}" is not a declared integration.`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error("\nEgress guard failed:\n");
  for (const problem of [...new Set(problems)]) console.error(`  - ${problem}`);
  console.error(
    "\nIf this addition is intentional, document it in AI_FEATURE_SYSTEM.md and add it to the\n" +
      "allowlist in tools/check-egress.mjs in the same change.\n",
  );
  process.exit(1);
}

console.log("[egress] OK — no AI provider SDKs, no model endpoints, no undeclared outbound hosts.");
