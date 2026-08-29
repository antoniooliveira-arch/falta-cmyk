import { createClient } from "@supabase/supabase-js";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";

const COOKIE_NAME = "app_session_id";
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  );
}

function getSessionSecret() {
  const secret = process.env.JWT_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

async function getUserByUsername(username) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username.toLowerCase())
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

async function getUserById(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

async function getUserByOpenId(openId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("openId", openId)
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

async function verifyPassword(password, storedHash) {
  const crypto = await import("node:crypto");
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const [iterationsStr, saltHex, hashHex] = parts;
  const iterations = parseInt(iterationsStr, 10);
  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(hashHex, "hex");
  const hash = crypto.createHash("sha256").update(password).update(salt).digest();
  if (hash.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(hash, expectedHash);
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
  res.setHeader("Set-Cookie", cookieOptions.join("; "));
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
  res.setHeader("Set-Cookie", cookieOptions.join("; "));
}

const handler = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace("/api/trpc/", "");

  if (path === "auth.login" && req.method === "POST") {
    try {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      await new Promise(resolve => req.on("end", resolve));
      const parsed = JSON.parse(body);
      const { username, password } = parsed.json ?? parsed;

      if (!username || !password) {
        return res.status(400).json({ error: { message: "Usuário e senha são obrigatórios" } });
      }

      const user = await getUserByUsername(username);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: { message: "Usuário ou senha inválidos" } });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: { message: "Usuário ou senha inválidos" } });
      }

      const sessionToken = await createSessionToken(`local_${user.id}`, user.name ?? "");

      setCookieHeaders(res, COOKIE_NAME, sessionToken, { maxAge: ONE_YEAR_MS / 1000 });
      
      return res.status(200).json({
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
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: { message: "Erro interno do servidor" } });
    }
  }

  if (path === "auth.logout" && req.method === "POST") {
    clearCookieHeaders(res, COOKIE_NAME);
    return res.status(200).json({ result: { data: { success: true } } });
  }

  if (path === "auth.me" && req.method === "GET") {
    const cookieHeader = req.headers.cookie || "";
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies[COOKIE_NAME];

    if (!sessionToken) {
      return res.status(200).json({ result: { data: null } });
    }

    try {
      const { payload } = await jwtVerify(sessionToken, getSessionSecret(), { algorithms: ["HS256"] });
      const { openId } = payload;

      if (typeof openId === "string" && openId.startsWith("local_")) {
        const userId = parseInt(openId.replace("local_", ""), 10);
        const user = await getUserById(userId);
        if (user) {
          return res.status(200).json({
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

    return res.status(200).json({ result: { data: null } });
  }

  // For other tRPC routes, return not implemented
  return res.status(404).json({ error: { message: "Not found" } });
};

export default handler;