import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
/** Repository root, so these suites run from any checkout. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Ephemeral Postgres (PGlite over the real wire protocol) for end-to-end journey testing.
// Lives outside the repository; nothing here is committed.
// REQUIRES: @electric-sql/pglite and @electric-sql/pglite-socket, installed
// OUTSIDE this repository on purpose — they are a local test convenience, not a
// project dependency, and must never enter the production lockfile.
//   mkdir -p ../lena-testdb && cd ../lena-testdb
//   npm install @electric-sql/pglite @electric-sql/pglite-socket
//   node <path-to-repo>/tools/test-database.mjs
// Without them, tools/verify-admin.sh reports SKIPPED rather than failing.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const MIGRATIONS = `${ROOT}/lib/db/drizzle`;
const db = await PGlite.create();

for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
  const sql = readFileSync(path.join(MIGRATIONS, file), "utf8");
  for (const statement of sql.split("--> statement-breakpoint")) {
    const trimmed = statement.trim();
    if (!trimmed) continue;
    try {
      await db.exec(trimmed);
    } catch (error) {
      console.error(`[db] ${file}: ${error.message.split("\n")[0]}`);
    }
  }
  console.log(`[db] applied ${file}`);
}

const tables = await db.query(
  "select table_name from information_schema.tables where table_schema='public' order by 1",
);
console.log("[db] tables:", tables.rows.map((r) => r.table_name).join(", "));

const server = new PGLiteSocketServer({ db, port: 5433, host: "127.0.0.1" });
await server.start();
console.log("[db] listening on 127.0.0.1:5433");
