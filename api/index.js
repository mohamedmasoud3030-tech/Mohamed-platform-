const loadApp = () => import("../artifacts/api-server/dist/vercel.mjs").then((module) => module.default);

export default async function handler(req, res) {
  const app = await loadApp();
  const url = new URL(req.url ?? "/", "http://localhost");
  const forwardedPath = url.searchParams.get("__path") ?? "";
  url.searchParams.delete("__path");
  req.url = `${forwardedPath ? `/api/${forwardedPath}` : "/api"}${url.search}`;
  return app(req, res);
}
