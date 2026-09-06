import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
/** Repository root, so these suites run from any checkout. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

import { createRequire } from "node:module";
/** Resolves a workspace dependency from the package that declares it. */
function resolveFrom(pkgPath, name) {
  return createRequire(resolve(ROOT, pkgPath)).resolve(name);
}

const pg = (await import(resolveFrom("lib/db/package.json", "pg"))).default;
const jose = await import(resolveFrom("artifacts/api-server/package.json", "jose"));

const SECRET = new TextEncoder().encode("local-e2e-secret-value");
const c = new pg.Client({ connectionString: "postgres://postgres:postgres@127.0.0.1:5433/postgres" });
await c.connect();

await c.query(`insert into users (union_id, name, email, role) values
  ('admin-1','Owner Admin','owner@example.com','admin'),
  ('user-1','Normal User','user@example.com','user')
  on conflict (union_id) do update set role = excluded.role`);

await c.query(`insert into inquiries (name, email, phone, service, message, source, status) values
  ('سارة الحارثي','sara.alharthi@example.com','+96891234567','property','أحتاج نظام تشغيل للعقارات','service:property','new'),
  ('John Carter','john.carter@example.com','+441632960111','rental','Need a dress-rental operating system','service:rental','new')
  on conflict do nothing`);

const sign = (unionId) => new jose.SignJWT({ unionId, clientId: "test-app" })
  .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(SECRET);

console.log(JSON.stringify({
  admin: await sign("admin-1"),
  user: await sign("user-1"),
  inquiries: (await c.query("select id, name from inquiries order by id")).rows,
}));
await c.end();
