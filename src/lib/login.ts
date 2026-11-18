import type { Db } from "./db";
import { checkLoginAllowed, clearFailures, recordFailure } from "./rate-limit";
import { createSession, purgeExpiredSessions } from "./session";

export type LoginResult =
  | { ok: true; token: string }
  | { ok: false; reason: "wrong-password" }
  | { ok: false; reason: "rate-limited"; retryAfterSeconds: number };

type LoginInput = {
  db: Db;
  verify: (candidate: string) => boolean;
  password: string;
  ip: string;
  now: number;
};

export function attemptLogin({ db, verify, password, ip, now }: LoginInput): LoginResult {
  const check = checkLoginAllowed(db, ip, now);
  if (!check.allowed) {
    return { ok: false, reason: "rate-limited", retryAfterSeconds: check.retryAfterSeconds };
  }
  if (!verify(password)) {
    recordFailure(db, ip, now);
    return { ok: false, reason: "wrong-password" };
  }
  clearFailures(db, ip);
  purgeExpiredSessions(db, now);
  return { ok: true, token: createSession(db, now) };
}
