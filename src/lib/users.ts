import type { Db } from "./db";
import { hashPassword, verifyPassword } from "./password";

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_FIELD_LENGTH = 200;

// Hash de uma senha que ninguém conhece. Quando o usuário não existe, a senha
// digitada é conferida contra ele, para o tempo de resposta não revelar se o
// usuário existe.
const UNKNOWN_USER_HASH = hashPassword("senha-de-usuario-inexistente");

export const normalizeUsername = (username: string) => username.trim();

export type CreateUserResult = { ok: true; created: boolean } | { ok: false; error: string };

export function validateNewCredentials(username: string, password: string): string | null {
  const name = normalizeUsername(username);
  if (name === "") return "O usuário não pode ficar vazio.";
  if (name.length > MAX_FIELD_LENGTH) return `O usuário pode ter no máximo ${MAX_FIELD_LENGTH} caracteres.`;
  if (password.length < MIN_PASSWORD_LENGTH) return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (password.length > MAX_FIELD_LENGTH) return `A senha pode ter no máximo ${MAX_FIELD_LENGTH} caracteres.`;
  return null;
}

// Cadastra o usuário ou, se ele já existe, troca a senha. Trocar a senha
// encerra todas as sessões abertas.
export function saveUser(db: Db, username: string, password: string, now: number): CreateUserResult {
  const error = validateNewCredentials(username, password);
  if (error) return { ok: false, error };

  const name = normalizeUsername(username);
  const exists = db.prepare("SELECT 1 AS ok FROM users WHERE username = ?").get(name) !== undefined;
  db.prepare(
    `INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)
     ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`,
  ).run(name, hashPassword(password), now);
  if (exists) db.exec("DELETE FROM sessions");
  return { ok: true, created: !exists };
}

export function countUsers(db: Db): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
}

export function verifyCredentials(db: Db, username: string, password: string): boolean {
  const row = db
    .prepare("SELECT password_hash FROM users WHERE username = ?")
    .get(normalizeUsername(username)) as { password_hash: string } | undefined;
  const passwordOk = verifyPassword(password, row?.password_hash ?? UNKNOWN_USER_HASH);
  return row !== undefined && passwordOk;
}
