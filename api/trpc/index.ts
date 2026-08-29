import { appRouter } from "../../server/routers";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import * as db from "../../server/db";
import { sdk } from "../../server/_core/sdk";
import { getSessionCookieOptions } from "../../server/_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { parse as parseCookieHeader } from "cookie";

function getSessionSecret() {
  const secret = process.env.JWT_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

async function getUserFromRequest(req: Request): Promise<User | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parseCookieHeader(cookieHeader);
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
      const user = await db.getUserByOpenId(openId);
      return user ?? null;
    }
  } catch (error) {
    console.warn("[Auth] Session verification failed", String(error));
  }
  return null;
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const user = await getUserFromRequest(req);
      return { req: {} as any, res: {} as any, user: user ?? null };
    },
  });

export default handler;