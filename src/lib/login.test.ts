import { describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import { attemptLogin } from "./login";
import { saveUser, verifyCredentials } from "./users";
import { findSession } from "./session";
import { IP_MAX_FAILURES } from "./rate-limit";

const right = { username: "dono", password: "senha-correta-123" };

// Um banco em memória com o usuário já cadastrado, como o comando create-user deixa.
function setup() {
  const db = openDatabase(":memory:");
  saveUser(db, right.username, right.password, 1_000);
  return { db, verify: (username: string, password: string) => verifyCredentials(db, username, password) };
}
const base = { ip: "1.1.1.1", now: 1_000 };

describe("attemptLogin", () => {
  it("usuário e senha certos criam uma sessão válida", () => {
    const { db, verify } = setup();
    const result = attemptLogin({ ...base, db, verify, ...right });
    expect(result.ok).toBe(true);
    if (result.ok) expect(findSession(db, result.token, 1_001)).toBe(true);
  });

  it("usuário errado com senha certa é rejeitado, sem sessão", () => {
    const { db, verify } = setup();
    expect(attemptLogin({ ...base, db, verify, ...right, username: "outro" })).toEqual({
      ok: false,
      reason: "invalid-credentials",
    });
    expect(db.prepare("SELECT COUNT(*) AS n FROM sessions").get()).toEqual({ n: 0 });
  });

  it("usuário certo com senha errada é rejeitado, com o mesmo resultado", () => {
    const { db, verify } = setup();
    const wrongUser = attemptLogin({ ...base, db, verify, ...right, username: "outro" });
    const wrongPassword = attemptLogin({ ...base, db, verify, ...right, password: "errada" });
    expect(wrongPassword).toEqual(wrongUser);
    expect(db.prepare("SELECT COUNT(*) AS n FROM sessions").get()).toEqual({ n: 0 });
  });

  it("falhas de usuário errado também contam no limite do IP", () => {
    const { db, verify } = setup();
    for (let i = 0; i < IP_MAX_FAILURES; i++) attemptLogin({ ...base, db, verify, ...right, username: "outro" });
    expect(attemptLogin({ ...base, db, verify, ...right })).toMatchObject({ ok: false, reason: "rate-limited" });
  });

  it("mais de 30 falhas de IPs diferentes não bloqueiam as credenciais certas de outro IP", () => {
    const { db, verify } = setup();
    for (let i = 0; i < 40; i++) {
      attemptLogin({ ...base, db, verify, ...right, password: "errada", ip: `10.0.0.${i}` });
    }
    expect(attemptLogin({ ...base, db, verify, ...right, ip: "9.9.9.9" }).ok).toBe(true);
  });

  it("bloqueia depois de muitas falhas, até com a senha certa", () => {
    const { db, verify } = setup();
    for (let i = 0; i < IP_MAX_FAILURES; i++) attemptLogin({ ...base, db, verify, ...right, password: "errada" });
    const result = attemptLogin({ ...base, db, verify, ...right });
    expect(result).toMatchObject({ ok: false, reason: "rate-limited", retryAfterSeconds: expect.any(Number) });
  });

  it("login certo zera as falhas anteriores do IP", () => {
    const { db, verify } = setup();
    for (let i = 0; i < IP_MAX_FAILURES - 1; i++) attemptLogin({ ...base, db, verify, ...right, password: "errada" });
    attemptLogin({ ...base, db, verify, ...right });
    expect(db.prepare("SELECT COUNT(*) AS n FROM login_failures").get()).toEqual({ n: 0 });
  });
});
