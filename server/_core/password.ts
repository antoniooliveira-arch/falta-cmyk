import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const HASH_ALGO = "sha256";
const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = createHash(HASH_ALGO).update(password).update(salt).digest();
  return `${ITERATIONS}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const [iterationsStr, saltHex, hashHex] = parts;
  const iterations = parseInt(iterationsStr, 10);
  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(hashHex, "hex");
  const hash = createHash(HASH_ALGO).update(password).update(salt).digest();
  if (hash.length !== expectedHash.length) return false;
  return timingSafeEqual(hash, expectedHash);
}