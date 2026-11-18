import { createHash, randomBytes } from "node:crypto";
import type { Db } from "./db";

export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// O token vai só no cookie; no banco fica apenas o hash dele.
export function createSession(db: Db, now: number): string {
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)").run(
    hashToken(token),
    now,
    now + SESSION_TTL_SECONDS,
  );
  return token;
}

export function findSession(db: Db, token: string, now: number): boolean {
  if (token === "") return false;
  const row = db
    .prepare("SELECT 1 AS ok FROM sessions WHERE token_hash = ? AND expires_at > ?")
    .get(hashToken(token), now);
  return row !== undefined;
}

export function deleteSession(db: Db, token: string): void {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

export function purgeExpiredSessions(db: Db, now: number): void {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
}
