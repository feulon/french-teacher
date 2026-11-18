import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;

// Guarda só o scrypt da senha (com sal aleatório do processo), nunca a senha
// em claro, e compara em tempo constante.
export function createPasswordVerifier(secret: string): (candidate: string) => boolean {
  const salt = randomBytes(16);
  const expected = scryptSync(secret, salt, KEY_LENGTH);
  return (candidate) => {
    const actual = scryptSync(candidate, salt, KEY_LENGTH);
    return timingSafeEqual(actual, expected);
  };
}
