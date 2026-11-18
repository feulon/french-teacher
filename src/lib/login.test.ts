import { describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import { attemptLogin } from "./login";
import { createCredentialVerifier } from "./password";
import { findSession } from "./session";
import { IP_MAX_FAILURES } from "./rate-limit";

const verify = createCredentialVerifier("dono", "senha-correta-123");
const base = { verify, ip: "1.1.1.1", now: 1_000 };

const right = { username: "dono", password: "senha-correta-123" };

describe("attemptLogin", () => {
  it("usuário e senha certos criam uma sessão válida", () => {
    const db = openDatabase(":memory:");
    const result = attemptLogin({ ...base, db, ...right });
    expect(result.ok).toBe(true);
    if (result.ok) expect(findSession(db, result.token, 1_001)).toBe(true);
  });

  it("usuário errado com senha certa é rejeitado, sem sessão", () => {
    const db = openDatabase(":memory:");
    expect(attemptLogin({ ...base, db, ...right, username: "outro" })).toEqual({
      ok: false,
      reason: "invalid-credentials",
    });
    expect(db.prepare("SELECT COUNT(*) AS n FROM sessions").get()).toEqual({ n: 0 });
  });

  it("usuário certo com senha errada é rejeitado, com o mesmo resultado", () => {
    const db = openDatabase(":memory:");
    const wrongUser = attemptLogin({ ...base, db, ...right, username: "outro" });
    const wrongPassword = attemptLogin({ ...base, db, ...right, password: "errada" });
    expect(wrongPassword).toEqual(wrongUser);
    expect(db.prepare("SELECT COUNT(*) AS n FROM sessions").get()).toEqual({ n: 0 });
  });

  it("falhas de usuário errado também contam no limite do IP", () => {
    const db = openDatabase(":memory:");
    for (let i = 0; i < IP_MAX_FAILURES; i++) attemptLogin({ ...base, db, ...right, username: "outro" });
    expect(attemptLogin({ ...base, db, ...right })).toMatchObject({ ok: false, reason: "rate-limited" });
  });

  it("mais de 30 falhas de IPs diferentes não bloqueiam as credenciais certas de outro IP", () => {
    const db = openDatabase(":memory:");
    for (let i = 0; i < 40; i++) {
      attemptLogin({ ...base, db, ...right, password: "errada", ip: `10.0.0.${i}` });
    }
    expect(attemptLogin({ ...base, db, ...right, ip: "9.9.9.9" }).ok).toBe(true);
  });

  it("bloqueia depois de muitas falhas, até com a senha certa", () => {
    const db = openDatabase(":memory:");
    for (let i = 0; i < IP_MAX_FAILURES; i++) attemptLogin({ ...base, db, ...right, password: "errada" });
    const result = attemptLogin({ ...base, db, ...right });
    expect(result).toMatchObject({ ok: false, reason: "rate-limited", retryAfterSeconds: expect.any(Number) });
  });

  it("login certo zera as falhas anteriores do IP", () => {
    const db = openDatabase(":memory:");
    for (let i = 0; i < IP_MAX_FAILURES - 1; i++) attemptLogin({ ...base, db, ...right, password: "errada" });
    attemptLogin({ ...base, db, ...right });
    expect(db.prepare("SELECT COUNT(*) AS n FROM login_failures").get()).toEqual({ n: 0 });
  });
});
