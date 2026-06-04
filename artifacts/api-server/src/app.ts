import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import * as trpcExpress from "@trpc/server/adapters/express";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { appRouter } from "./trpc/router";
import { createTrpcContext } from "./trpc/context";
import { createOAuthCallbackHandler, createOAuthLoginHandler } from "./auth/oauth";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/oauth/login", createOAuthLoginHandler());
app.get("/api/oauth/callback", createOAuthCallbackHandler());

app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => createTrpcContext(req, res),
  }),
);

app.use("/api", router);

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
app.use("/api/uploads", express.static(UPLOADS_DIR));

export default app;
