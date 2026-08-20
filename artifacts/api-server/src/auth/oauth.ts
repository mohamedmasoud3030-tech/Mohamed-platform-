import type { Request, Response } from "express";
import cookie from "cookie";
import { randomBytes, timingSafeEqual } from "crypto";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq } from "drizzle-orm";
import * as jose from "jose";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSessionToken, createAuthContext } from "../middleware/auth";
import { logger } from "../lib/logger";

const OAUTH_STATE_COOKIE = "kimi_oauth_state";
const OAUTH_NEXT_COOKIE = "kimi_oauth_next";
const DEFAULT_POST_LOGIN_PATH = "/dashboard";
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

function getEnv(key: string): string {
  return process.env[key] ?? "";
}

function getRequiredEnv(key: string): string {
  const value = getEnv(key).trim();
  if (!value) throw new Error(`${key} environment variable is required.`);
  return value;
}

function getRequestOrigin(req: Request): string {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto?.split(",")[0]?.trim() || req.protocol;
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost?.split(",")[0]?.trim() || req.headers.host;

  if (!host) throw new Error("Unable to determine request host.");
  return `${proto}://${host}`;
}

function getRedirectUri(req: Request): string {
  return `${getRequestOrigin(req)}/api/oauth/callback`;
}

function isLocalhost(host: string): boolean {
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

function getCookieOptions(req: Request, maxAge: number) {
  const host = req.headers.host || "";
  const localhost = isLocalhost(host);
  return {
    httpOnly: true,
    path: "/",
    sameSite: localhost ? "lax" as const : "none" as const,
    secure: !localhost,
    maxAge,
  };
}

function clearOAuthStateCookie(req: Request, res: Response) {
  res.appendHeader(
    "set-cookie",
    cookie.serialize(OAUTH_STATE_COOKIE, "", {
      ...getCookieOptions(req, 0),
      expires: new Date(0),
    }),
  );
}

/**
 * Only same-origin admin paths are accepted, so the sign-in redirect can never
 * be used to bounce a signed-in owner to an external site.
 */
function sanitizeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return null;
  if (!/^\/dashboard(?:\/[A-Za-z0-9\-._~/]*)?$/.test(candidate)) return null;
  return candidate;
}

function readNextPath(req: Request): string {
  const cookies = cookie.parse(req.headers.cookie || "");
  return sanitizeNextPath(cookies[OAUTH_NEXT_COOKIE]) ?? DEFAULT_POST_LOGIN_PATH;
}

function clearNextCookie(req: Request, res: Response) {
  res.appendHeader(
    "set-cookie",
    cookie.serialize(OAUTH_NEXT_COOKIE, "", { ...getCookieOptions(req, 0), expires: new Date(0) }),
  );
}

function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

async function exchangeAuthCode(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: getRequiredEnv("APP_ID"),
    redirect_uri: redirectUri,
    client_secret: getRequiredEnv("APP_SECRET"),
  });

  const resp = await fetch(`${getRequiredEnv("KIMI_AUTH_URL")}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<{ access_token: string; token_type: string }>;
}

const jwksCache = new Map<string, ReturnType<typeof jose.createRemoteJWKSet>>();

function getJwks() {
  const url = `${getRequiredEnv("KIMI_AUTH_URL")}/api/.well-known/jwks.json`;
  if (!jwksCache.has(url)) {
    jwksCache.set(url, jose.createRemoteJWKSet(new URL(url)));
  }
  return jwksCache.get(url)!;
}

async function verifyProviderToken(accessToken: string): Promise<{ userId: string }> {
  const { payload } = await jose.jwtVerify(accessToken, getJwks());
  const userId = payload.user_id as string;
  if (!userId) throw new Error("user_id missing from access token");
  return { userId };
}

async function getUserProfile(accessToken: string) {
  const resp = await fetch(`${getRequiredEnv("KIMI_OPEN_URL")}/v1/users/me/profile`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!resp.ok) return null;
  return resp.json() as Promise<{ user_id: string; name: string; avatar_url: string }>;
}

export function createOAuthLoginHandler() {
  return async (req: Request, res: Response) => {
    const requestedNext = sanitizeNextPath((req.query as Record<string, unknown>).next);

    const existing = await createAuthContext(req);
    if (existing.user) return res.redirect(requestedNext ?? DEFAULT_POST_LOGIN_PATH);

    try {
      const redirectUri = getRedirectUri(req);
      const state = randomBytes(32).toString("base64url");
      const url = new URL(`${getRequiredEnv("KIMI_AUTH_URL")}/api/oauth/authorize`);
      url.searchParams.set("client_id", getRequiredEnv("APP_ID"));
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "profile");
      url.searchParams.set("state", state);

      res.setHeader(
        "set-cookie",
        cookie.serialize(OAUTH_STATE_COOKIE, state, getCookieOptions(req, OAUTH_STATE_MAX_AGE_SECONDS)),
      );
      res.appendHeader(
        "set-cookie",
        cookie.serialize(
          OAUTH_NEXT_COOKIE,
          requestedNext ?? "",
          getCookieOptions(req, requestedNext ? OAUTH_STATE_MAX_AGE_SECONDS : 0),
        ),
      );

      return res.redirect(url.toString());
    } catch (err) {
      logger.error({ err }, "OAuth login failed");
      return res.redirect("/login?error=unavailable");
    }
  };
}

export function createOAuthCallbackHandler() {
  return async (req: Request, res: Response) => {
    // If the user already has a valid session, skip the OAuth flow
    const existing = await createAuthContext(req);
    if (existing.user) {
      const target = readNextPath(req);
      clearNextCookie(req, res);
      return res.redirect(target);
    }

    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      clearOAuthStateCookie(req, res);
      clearNextCookie(req, res);
      if (error === "access_denied") return res.redirect("/login?error=cancelled");
      return res.redirect("/login?error=provider");
    }

    if (!code || !state) {
      clearOAuthStateCookie(req, res);
      clearNextCookie(req, res);
      return res.redirect("/login?error=incomplete");
    }

    const cookies = cookie.parse(req.headers.cookie || "");
    const expectedState = cookies[OAUTH_STATE_COOKIE];
    clearOAuthStateCookie(req, res);

    if (!expectedState || !safeCompare(expectedState, state)) {
      clearNextCookie(req, res);
      return res.redirect("/login?error=expired");
    }

    try {
      const redirectUri = getRedirectUri(req);
      const tokenResp = await exchangeAuthCode(code, redirectUri);
      const { userId } = await verifyProviderToken(tokenResp.access_token);
      const profile = await getUserProfile(tokenResp.access_token);

      const ownerUnionId = getEnv("OWNER_UNION_ID");
      const role = (ownerUnionId && userId === ownerUnionId) ? "admin" : "user";

      await db.insert(users).values({
        unionId: userId,
        name: profile?.name,
        avatar: profile?.avatar_url,
        role,
        lastSignInAt: new Date(),
      }).onConflictDoUpdate({
        target: users.unionId,
        set: {
          name: profile?.name,
          avatar: profile?.avatar_url,
          lastSignInAt: new Date(),
          ...(ownerUnionId && userId === ownerUnionId ? { role: "admin" } : {}),
        },
      });

      const token = await signSessionToken({ unionId: userId, clientId: getRequiredEnv("APP_ID") });

      res.appendHeader(
        "set-cookie",
        cookie.serialize(SESSION_COOKIE, token, getCookieOptions(req, SESSION_MAX_AGE_SECONDS)),
      );

      const target = readNextPath(req);
      clearNextCookie(req, res);
      return res.redirect(target);
    } catch (err) {
      logger.error({ err }, "OAuth callback failed");
      clearNextCookie(req, res);
      return res.redirect("/login?error=failed");
    }
  };
}
