import { createRouter, authedQuery } from "../middleware";
import { SESSION_COOKIE } from "../context";
import { cookiePath } from "../../lib/base-path";
import cookie from "cookie";

function isLocalhost(host: string): boolean {
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  logout: authedQuery.mutation(async (opts) => {
    const { req, res } = opts.ctx;
    const host = req.headers.host || "";
    const localhost = isLocalhost(host);

    res.setHeader(
      "set-cookie",
      cookie.serialize(SESSION_COOKIE, "", {
        httpOnly: true,
        path: cookiePath(),
        sameSite: "lax",
        secure: !localhost,
        maxAge: 0,
        expires: new Date(0),
      }),
    );

    return { success: true };
  }),
});
