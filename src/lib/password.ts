import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;

const sha256 = (value: string) => createHash("sha256").update(value).digest();

// Guarda só o scrypt da senha (com sal aleatório do processo), nunca a senha
// em claro. Usuário e senha são sempre ambos verificados, em tempo constante,
// para o tempo de resposta não revelar qual campo errou.
export function createCredentialVerifier(
  username: string,
  secret: string,
): (candidateUsername: string, candidatePassword: string) => boolean {
  const salt = randomBytes(16);
  const expectedUser = sha256(username);
  const expectedPassword = scryptSync(secret, salt, KEY_LENGTH);
  return (candidateUsername, candidatePassword) => {
    const userOk = timingSafeEqual(sha256(candidateUsername), expectedUser);
    const passwordOk = timingSafeEqual(scryptSync(candidatePassword, salt, KEY_LENGTH), expectedPassword);
    return userOk && passwordOk;
  };
}
