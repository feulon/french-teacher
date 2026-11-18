import type { Db } from "./db";

export const WINDOW_SECONDS = 15 * 60;
export const IP_MAX_FAILURES = 5;
// Como há um único usuário, o total de falhas também é limitado: isso segura
// quem troca de IP (ou forja o cabeçalho de IP) para escapar do limite por IP.
export const GLOBAL_MAX_FAILURES = 30;

export type LoginCheck = { allowed: true } | { allowed: false; retryAfterSeconds: number };

type Window = { n: number; oldest: number | null };

function windowFor(db: Db, ip: string | null, since: number): Window {
  const sql =
    ip === null
      ? "SELECT COUNT(*) AS n, MIN(at) AS oldest FROM login_failures WHERE at > ?"
      : "SELECT COUNT(*) AS n, MIN(at) AS oldest FROM login_failures WHERE at > ? AND ip = ?";
  const params = ip === null ? [since] : [since, ip];
  return db.prepare(sql).get(...params) as unknown as Window;
}

export function checkLoginAllowed(db: Db, ip: string, now: number): LoginCheck {
  const since = now - WINDOW_SECONDS;
  const waits: number[] = [];

  const perIp = windowFor(db, ip, since);
  if (perIp.n >= IP_MAX_FAILURES && perIp.oldest !== null) {
    waits.push(perIp.oldest + WINDOW_SECONDS - now);
  }
  const global = windowFor(db, null, since);
  if (global.n >= GLOBAL_MAX_FAILURES && global.oldest !== null) {
    waits.push(global.oldest + WINDOW_SECONDS - now);
  }

  if (waits.length === 0) return { allowed: true };
  return { allowed: false, retryAfterSeconds: Math.max(...waits) };
}

export function recordFailure(db: Db, ip: string, now: number): void {
  db.prepare("INSERT INTO login_failures (ip, at) VALUES (?, ?)").run(ip, now);
  db.prepare("DELETE FROM login_failures WHERE at <= ?").run(now - WINDOW_SECONDS);
}

export function clearFailures(db: Db, ip: string): void {
  db.prepare("DELETE FROM login_failures WHERE ip = ?").run(ip);
}
