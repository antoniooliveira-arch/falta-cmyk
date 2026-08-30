import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";
import { jwtVerify } from "jose";

function getSessionSecret() {
  const secret = process.env.JWT_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

async function getUserFromLocalSession(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  const sessionToken = cookies[COOKIE_NAME];
  if (!sessionToken) return null;

  try {
    const { payload } = await jwtVerify(sessionToken, getSessionSecret(), { algorithms: ["HS256"] });
    const { openId, name } = payload as Record<string, unknown>;
    
    if (typeof openId === "string" && openId.startsWith("local_")) {
      const userId = parseInt(openId.replace("local_", ""), 10);
      const user = await db.getUserById(userId);
      return user ?? null;
    }
    
    if (typeof openId === "string") {
      return await db.getUserByOpenId(openId);
    }
  } catch (error) {
    console.warn("[Auth] Local session verification failed", String(error));
  }
  return null;
}

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Try local password-based session first
  user = await getUserFromLocalSession(opts.req);

  // Fallback to OAuth session
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
