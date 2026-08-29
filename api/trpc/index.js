import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { hashPassword, verifyPassword } from "../../../server/_core/password";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "app_session_id";
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

let _db = null;
function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

function getSessionSecret() {
  const secret = process.env.JWT_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

async function getUserByUsername(username) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
  return result[0];
}

async function createSessionToken(openId, name) {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  const secretKey = getSessionSecret();

  return new SignJWT({
    openId,
    appId: process.env.VITE_APP_ID ?? "",
    name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(cookieHeader.split("; ").map(c => c.split("=")));
}

function setCookieHeaders(res, name, value, options = {}) {
  const cookieOptions = [
    `${name}=${value}`,
    `Path=${options.path || "/"}`,
    `HttpOnly`,
    `Secure`,
    `SameSite=${options.sameSite || "none"}`,
    `Max-Age=${options.maxAge || ONE_YEAR_MS / 1000}`,
  ];
  res.headers.set("Set-Cookie", cookieOptions.join("; "));
}

function clearCookieHeaders(res, name) {
  const cookieOptions = [
    `${name}=`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=none`,
    `Max-Age=0`,
  ];
  res.headers.set("Set-Cookie", cookieOptions.join("; "));
}

const handler = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/api/trpc/", "");

  if (path === "auth.login" && req.method === "POST") {
    try {
      const body = await req.json();
      const { username, password } = body.json ?? body;

      if (!username || !password) {
        return Response.json({ error: { message: "Usuário e senha são obrigatórios" } }, { status: 400 });
      }

      const user = await getUserByUsername(username);
      if (!user || !user.passwordHash) {
        return Response.json({ error: { message: "Usuário ou senha inválidos" } }, { status: 401 });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return Response.json({ error: { message: "Usuário ou senha inválidos" } }, { status: 401 });
      }

      const sessionToken = await createSessionToken(`local_${user.id}`, user.name ?? "");

      const response = Response.json({
        result: {
          data: {
            user: {
              id: user.id,
              name: user.name,
              username: user.username,
              role: user.role,
              mustChangePassword: user.mustChangePassword,
            }
          }
        }
      });

      setCookieHeaders(response, COOKIE_NAME, sessionToken, { maxAge: ONE_YEAR_MS / 1000 });
      return response;
    } catch (error) {
      console.error("Login error:", error);
      return Response.json({ error: { message: "Erro interno do servidor" } }, { status: 500 });
    }
  }

  if (path === "auth.logout" && req.method === "POST") {
    const response = Response.json({ result: { data: { success: true } } });
    clearCookieHeaders(response, COOKIE_NAME);
    return response;
  }

  if (path === "auth.me" && req.method === "GET") {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies[COOKIE_NAME];

    if (!sessionToken) {
      return Response.json({ result: { data: null } });
    }

    try {
      const { payload } = await jwtVerify(sessionToken, getSessionSecret(), { algorithms: ["HS256"] });
      const { openId, name } = payload;

      if (typeof openId === "string" && openId.startsWith("local_")) {
        const userId = parseInt(openId.replace("local_", ""), 10);
        const user = await getUserById(userId);
        if (user) {
          return Response.json({
            result: {
              data: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
              }
            }
          });
        }
      }
    } catch (error) {
      console.warn("Session verification failed:", error);
    }

    return Response.json({ result: { data: null } });
  }

  return Response.json({ error: { message: "Not found" } }, { status: 404 });
};

async function getUserById(userId) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export default handler;