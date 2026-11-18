import type { Db } from "./db";

export const WINDOW_SECONDS = 15 * 60;
export const IP_MAX_FAILURES = 5;
// O limite é só por IP: falhas de outros IPs nunca bloqueiam as credenciais
// corretas. A defesa contra quem troca de IP é a senha longa exigida (mínimo de
// 12 caracteres), não um limite global.

export type LoginCheck = { allowed: true } | { allowed: false; retryAfterSeconds: number };

type Window = { n: number; oldest: number | null };

function windowFor(db: Db, ip: string, since: number): Window {
  return db
    .prepare("SELECT COUNT(*) AS n, MIN(at) AS oldest FROM login_failures WHERE at > ? AND ip = ?")
    .get(since, ip) as unknown as Window;
}

export function checkLoginAllowed(db: Db, ip: string, now: number): LoginCheck {
  const since = now - WINDOW_SECONDS;
  const perIp = windowFor(db, ip, since);
  if (perIp.n >= IP_MAX_FAILURES && perIp.oldest !== null) {
    return { allowed: false, retryAfterSeconds: perIp.oldest + WINDOW_SECONDS - now };
  }
  return { allowed: true };
}

export function recordFailure(db: Db, ip: string, now: number): void {
  db.prepare("INSERT INTO login_failures (ip, at) VALUES (?, ?)").run(ip, now);
  db.prepare("DELETE FROM login_failures WHERE at <= ?").run(now - WINDOW_SECONDS);
}

export function clearFailures(db: Db, ip: string): void {
  db.prepare("DELETE FROM login_failures WHERE ip = ?").run(ip);
}
