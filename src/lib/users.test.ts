import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { createSession, findSession } from "./session";
import { MIN_PASSWORD_LENGTH, countUsers, saveUser, verifyCredentials } from "./users";

describe("hash de senha", () => {
  it("confere a senha certa e recusa a errada", () => {
    const stored = hashPassword("correct horse battery");
    expect(verifyPassword("correct horse battery", stored)).toBe(true);
    expect(verifyPassword("correct horse batter", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("não guarda a senha e usa um sal diferente a cada hash", () => {
    const a = hashPassword("correct horse battery");
    const b = hashPassword("correct horse battery");
    expect(a).not.toContain("correct horse battery");
    expect(a).not.toBe(b);
  });

  it("um valor guardado malformado nunca autentica", () => {
    for (const stored of ["", "scrypt", "md5$1$2$3$a$b", "scrypt$16384$8$1$$", "scrypt$abc$8$1$AAAA$AAAA"]) {
      expect(verifyPassword("qualquer coisa", stored)).toBe(false);
    }
  });
});

describe("usuários", () => {
  let db: ReturnType<typeof openDatabase>;
  beforeEach(() => {
    db = openDatabase(":memory:");
  });

  it("cadastra e depois autentica com usuário e senha", () => {
    expect(saveUser(db, "dono", "senha-longa-123", 1_000)).toEqual({ ok: true, created: true });
    expect(verifyCredentials(db, "dono", "senha-longa-123")).toBe(true);
    expect(countUsers(db)).toBe(1);
  });

  it("grava só o hash da senha no SQLite", () => {
    saveUser(db, "dono", "senha-longa-123", 1_000);
    const row = db.prepare("SELECT username, password_hash FROM users").get() as {
      username: string;
      password_hash: string;
    };
    expect(row.username).toBe("dono");
    expect(row.password_hash).toMatch(/^scrypt\$/);
    expect(JSON.stringify(row)).not.toContain("senha-longa-123");
  });

  it("recusa usuário errado, senha errada e usuário desconhecido", () => {
    saveUser(db, "dono", "senha-longa-123", 1_000);
    expect(verifyCredentials(db, "outro", "senha-longa-123")).toBe(false);
    expect(verifyCredentials(db, "dono", "senha-longa-124")).toBe(false);
    expect(verifyCredentials(db, "", "")).toBe(false);
    expect(verifyCredentials(db, "x".repeat(500), "y".repeat(500))).toBe(false);
  });

  it("não autentica nada quando não há usuário cadastrado", () => {
    expect(verifyCredentials(db, "dono", "senha-longa-123")).toBe(false);
  });

  it("ignora espaços nas pontas do usuário, no cadastro e no login", () => {
    saveUser(db, "  dono ", "senha-longa-123", 1_000);
    expect(verifyCredentials(db, "dono", "senha-longa-123")).toBe(true);
    expect(verifyCredentials(db, "dono ", "senha-longa-123")).toBe(true);
  });

  it(`exige senha com pelo menos ${MIN_PASSWORD_LENGTH} caracteres`, () => {
    const short = saveUser(db, "dono", "x".repeat(MIN_PASSWORD_LENGTH - 1), 1_000);
    expect(short).toMatchObject({ ok: false, error: expect.stringContaining(String(MIN_PASSWORD_LENGTH)) });
    expect(countUsers(db)).toBe(0);
    expect(saveUser(db, "dono", "x".repeat(MIN_PASSWORD_LENGTH), 1_000)).toEqual({ ok: true, created: true });
  });

  it("recusa usuário vazio e campos grandes demais para o login aceitar", () => {
    expect(saveUser(db, "   ", "senha-longa-123", 1_000).ok).toBe(false);
    expect(saveUser(db, "dono", "x".repeat(201), 1_000).ok).toBe(false);
    expect(saveUser(db, "u".repeat(201), "senha-longa-123", 1_000).ok).toBe(false);
    expect(countUsers(db)).toBe(0);
  });

  it("cadastrar de novo troca a senha e encerra as sessões abertas", () => {
    saveUser(db, "dono", "senha-longa-123", 1_000);
    const token = createSession(db, 1_000);
    expect(saveUser(db, "dono", "outra-senha-456", 2_000)).toEqual({ ok: true, created: false });
    expect(verifyCredentials(db, "dono", "senha-longa-123")).toBe(false);
    expect(verifyCredentials(db, "dono", "outra-senha-456")).toBe(true);
    expect(findSession(db, token, 2_001)).toBe(false);
    expect(countUsers(db)).toBe(1);
  });

  it("uma senha recusada não mexe na senha nem nas sessões existentes", () => {
    saveUser(db, "dono", "senha-longa-123", 1_000);
    const token = createSession(db, 1_000);
    expect(saveUser(db, "dono", "curta", 2_000).ok).toBe(false);
    expect(verifyCredentials(db, "dono", "senha-longa-123")).toBe(true);
    expect(findSession(db, token, 2_001)).toBe(true);
  });
});
