/**
 * Custom Playwright reporter — writes one machine-readable artifacts file per
 * run so CI can attach a compact, diagnosable summary:
 * route, viewport, locale, theme, status, failure reason, attached files.
 */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GUARD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SUMMARY = resolve(GUARD_DIR, "test-results", "qa-artifacts.jsonl");

const annotation = (testInfo, key) =>
  testInfo.annotations.find((entry) => entry.type === key)?.description ?? null;

export default class ArtifactReporter {
  onBegin() {
    mkdirSync(dirname(SUMMARY), { recursive: true });
    writeFileSync(SUMMARY, "");
  }

  onTestEnd(test, result) {
    const record = {
      title: test.titlePath().join(" › "),
      project: test.parent?.project()?.name ?? test.parent?.title ?? "unknown",
      status: result.status,
      route: annotation(test, "route"),
      viewport: annotation(test, "viewport"),
      locale: annotation(test, "locale"),
      theme: annotation(test, "theme"),
      error:
        result.error
          ? `${result.error.message}\n${(result.error.stack ?? "").split("\n").slice(0, 8).join("\n")}`
          : null,
      attachments: result.attachments.map((attachment) => ({
        name: attachment.name,
        contentType: attachment.contentType,
        path: resolve(GUARD_DIR, "test-results", attachment.path ?? ""),
      })),
      durationMs: result.duration,
    };
    appendFileSync(SUMMARY, `${JSON.stringify(record)}\n`);
  }

  onEnd() {
    console.log(`[guardian] artifact summary: ${SUMMARY}`);
  }
}
