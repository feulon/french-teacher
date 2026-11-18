import { describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import { attemptLogin } from "./login";
import { createPasswordVerifier } from "./password";
import { findSession } from "./session";
import { IP_MAX_FAILURES } from "./rate-limit";

const verify = createPasswordVerifier("senha-correta-123");
const base = { verify, ip: "1.1.1.1", now: 1_000 };

describe("attemptLogin", () => {
  it("senha certa cria uma sessão válida", () => {
    const db = openDatabase(":memory:");
    const result = attemptLogin({ ...base, db, password: "senha-correta-123" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(findSession(db, result.token, 1_001)).toBe(true);
  });

  it("senha errada não cria sessão", () => {
    const db = openDatabase(":memory:");
    expect(attemptLogin({ ...base, db, password: "errada" })).toEqual({
      ok: false,
      reason: "wrong-password",
    });
    expect(db.prepare("SELECT COUNT(*) AS n FROM sessions").get()).toEqual({ n: 0 });
  });

  it("bloqueia depois de muitas falhas, até com a senha certa", () => {
    const db = openDatabase(":memory:");
    for (let i = 0; i < IP_MAX_FAILURES; i++) attemptLogin({ ...base, db, password: "errada" });
    const result = attemptLogin({ ...base, db, password: "senha-correta-123" });
    expect(result).toMatchObject({ ok: false, reason: "rate-limited" });
  });

  it("login certo zera as falhas anteriores do IP", () => {
    const db = openDatabase(":memory:");
    for (let i = 0; i < IP_MAX_FAILURES - 1; i++) attemptLogin({ ...base, db, password: "errada" });
    attemptLogin({ ...base, db, password: "senha-correta-123" });
    expect(db.prepare("SELECT COUNT(*) AS n FROM login_failures").get()).toEqual({ n: 0 });
  });
});
