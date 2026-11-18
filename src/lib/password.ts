import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Formato guardado no banco: scrypt$N$r$p$salt$hash (salt e hash em base64).
// Os parâmetros vão junto para poder aumentá-los depois sem invalidar senhas antigas.
const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const hash = scryptSync(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

// Em tempo constante em relação ao conteúdo da senha. Um valor guardado
// malformado nunca autentica.
export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !n || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  if (expected.length === 0) return false;
  try {
    const actual = scryptSync(password, Buffer.from(salt, "base64"), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
