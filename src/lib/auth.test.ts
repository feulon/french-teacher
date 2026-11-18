import { describe, expect, it, beforeEach } from "vitest";
import { openDatabase } from "./db";
import { createPasswordVerifier } from "./password";
import {
  SESSION_TTL_SECONDS,
  createSession,
  deleteSession,
  findSession,
  purgeExpiredSessions,
} from "./session";
import {
  GLOBAL_MAX_FAILURES,
  IP_MAX_FAILURES,
  WINDOW_SECONDS,
  checkLoginAllowed,
  clearFailures,
  recordFailure,
} from "./rate-limit";
import { loadConfig } from "./config";

describe("loadConfig", () => {
  it("exige APP_PASSWORD", () => {
    expect(() => loadConfig({})).toThrow(/APP_PASSWORD/);
  });

  it("rejeita senha curta", () => {
    expect(() => loadConfig({ APP_PASSWORD: "curta" })).toThrow(/8/);
  });

  it("usa ./data como padrão e respeita DATA_DIR", () => {
    expect(loadConfig({ APP_PASSWORD: "senha-longa-1" }).dataDir).toBe("./data");
    expect(loadConfig({ APP_PASSWORD: "senha-longa-1", DATA_DIR: "/data" }).dataDir).toBe("/data");
  });

  it("COOKIE_SECURE aceita auto, true e false", () => {
    const base = { APP_PASSWORD: "senha-longa-1" };
    expect(loadConfig(base).cookieSecure).toBe("auto");
    expect(loadConfig({ ...base, COOKIE_SECURE: "true" }).cookieSecure).toBe("true");
    expect(loadConfig({ ...base, COOKIE_SECURE: "false" }).cookieSecure).toBe("false");
    expect(() => loadConfig({ ...base, COOKIE_SECURE: "talvez" })).toThrow(/COOKIE_SECURE/);
  });
});

describe("createPasswordVerifier", () => {
  const verify = createPasswordVerifier("correct horse battery");

  it("aceita a senha certa", () => {
    expect(verify("correct horse battery")).toBe(true);
  });

  it("rejeita senha errada, vazia e de outro tamanho", () => {
    expect(verify("correct horse batter")).toBe(false);
    expect(verify("")).toBe(false);
    expect(verify("x".repeat(500))).toBe(false);
  });
});

describe("sessões", () => {
  let db: ReturnType<typeof openDatabase>;
  beforeEach(() => {
    db = openDatabase(":memory:");
  });

  it("cria, encontra e apaga uma sessão", () => {
    const token = createSession(db, 1_000);
    expect(findSession(db, token, 1_001)).toBe(true);
    deleteSession(db, token);
    expect(findSession(db, token, 1_001)).toBe(false);
  });

  it("não guarda o token em claro", () => {
    const token = createSession(db, 1_000);
    const rows = db.prepare("SELECT token_hash FROM sessions").all() as { token_hash: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toContain(token);
  });

  it("expira depois do prazo", () => {
    const token = createSession(db, 1_000);
    expect(findSession(db, token, 1_000 + SESSION_TTL_SECONDS - 1)).toBe(true);
    expect(findSession(db, token, 1_000 + SESSION_TTL_SECONDS)).toBe(false);
  });

  it("rejeita token desconhecido ou vazio", () => {
    createSession(db, 1_000);
    expect(findSession(db, "nada", 1_001)).toBe(false);
    expect(findSession(db, "", 1_001)).toBe(false);
  });

  it("remove sessões vencidas", () => {
    createSession(db, 1_000);
    const vivo = createSession(db, 1_000 + SESSION_TTL_SECONDS);
    purgeExpiredSessions(db, 1_000 + SESSION_TTL_SECONDS + 1);
    expect(db.prepare("SELECT COUNT(*) AS n FROM sessions").get()).toEqual({ n: 1 });
    expect(findSession(db, vivo, 1_000 + SESSION_TTL_SECONDS + 1)).toBe(true);
  });
});

describe("limite de tentativas de login", () => {
  let db: ReturnType<typeof openDatabase>;
  beforeEach(() => {
    db = openDatabase(":memory:");
  });

  it("libera quando não há falhas", () => {
    expect(checkLoginAllowed(db, "1.1.1.1", 1_000)).toEqual({ allowed: true });
  });

  it("bloqueia o IP depois do limite e informa quanto esperar", () => {
    for (let i = 0; i < IP_MAX_FAILURES; i++) recordFailure(db, "1.1.1.1", 1_000 + i);
    const result = checkLoginAllowed(db, "1.1.1.1", 1_100);
    expect(result).toEqual({ allowed: false, retryAfterSeconds: 1_000 + WINDOW_SECONDS - 1_100 });
  });

  it("não bloqueia outro IP por causa de um IP", () => {
    for (let i = 0; i < IP_MAX_FAILURES; i++) recordFailure(db, "1.1.1.1", 1_000);
    expect(checkLoginAllowed(db, "2.2.2.2", 1_001)).toEqual({ allowed: true });
  });

  it("libera de novo quando as falhas saem da janela", () => {
    for (let i = 0; i < IP_MAX_FAILURES; i++) recordFailure(db, "1.1.1.1", 1_000);
    expect(checkLoginAllowed(db, "1.1.1.1", 1_000 + WINDOW_SECONDS).allowed).toBe(true);
  });

  it("limite global bloqueia mesmo trocando de IP", () => {
    for (let i = 0; i < GLOBAL_MAX_FAILURES; i++) recordFailure(db, `10.0.0.${i}`, 1_000);
    const result = checkLoginAllowed(db, "9.9.9.9", 1_001);
    expect(result.allowed).toBe(false);
  });

  it("um login certo zera as falhas do IP", () => {
    for (let i = 0; i < IP_MAX_FAILURES; i++) recordFailure(db, "1.1.1.1", 1_000);
    clearFailures(db, "1.1.1.1");
    expect(checkLoginAllowed(db, "1.1.1.1", 1_001)).toEqual({ allowed: true });
  });
});
