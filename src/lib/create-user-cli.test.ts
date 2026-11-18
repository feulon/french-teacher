import { describe, expect, it } from "vitest";
import { runCreateUser, type CliIo } from "./create-user-cli";
import { openDatabase } from "./db";
import { countUsers, verifyCredentials } from "./users";

function fakeIo(options: { interactive: boolean; answers?: string[]; stdin?: string }) {
  const out: string[] = [];
  const err: string[] = [];
  const asked: { label: string; hidden: boolean }[] = [];
  const answers = [...(options.answers ?? [])];
  const io: CliIo = {
    interactive: options.interactive,
    prompt: async (label, { hidden }) => {
      asked.push({ label, hidden });
      return answers.shift() ?? "";
    },
    readPasswordFromStdin: async () => options.stdin ?? "",
    out: (line) => out.push(line),
    err: (line) => err.push(line),
  };
  return { io, out, err, asked };
}

describe("create-user", () => {
  it("interativo: pergunta usuário e senha (sem eco), cadastra e depois o login confere", async () => {
    const db = openDatabase(":memory:");
    const { io, out, asked } = fakeIo({ interactive: true, answers: ["dono", "senha-longa-123", "senha-longa-123"] });
    expect(await runCreateUser([], db, io, 1_000)).toBe(0);
    expect(out.join("\n")).toContain('Usuário "dono" cadastrado');
    expect(asked.map((a) => a.hidden)).toEqual([false, true, true]);
    expect(verifyCredentials(db, "dono", "senha-longa-123")).toBe(true);
  });

  it("interativo: usa o usuário passado como argumento e não pergunta de novo", async () => {
    const db = openDatabase(":memory:");
    const { io, asked } = fakeIo({ interactive: true, answers: ["senha-longa-123", "senha-longa-123"] });
    expect(await runCreateUser(["dono"], db, io, 1_000)).toBe(0);
    expect(asked.map((a) => a.label)).toEqual(["Senha: ", "Repita a senha: "]);
    expect(verifyCredentials(db, "dono", "senha-longa-123")).toBe(true);
  });

  it("interativo: senhas diferentes não cadastram nada", async () => {
    const db = openDatabase(":memory:");
    const { io, err } = fakeIo({ interactive: true, answers: ["dono", "senha-longa-123", "senha-longa-124"] });
    expect(await runCreateUser([], db, io, 1_000)).toBe(1);
    expect(err.join("\n")).toContain("não são iguais");
    expect(countUsers(db)).toBe(0);
  });

  it("por pipe: lê a senha da entrada padrão", async () => {
    const db = openDatabase(":memory:");
    const { io } = fakeIo({ interactive: false, stdin: "senha-longa-123" });
    expect(await runCreateUser(["dono"], db, io, 1_000)).toBe(0);
    expect(verifyCredentials(db, "dono", "senha-longa-123")).toBe(true);
  });

  it("por pipe: sem usuário no argumento, falha sem cadastrar", async () => {
    const db = openDatabase(":memory:");
    const { io, err } = fakeIo({ interactive: false, stdin: "senha-longa-123" });
    expect(await runCreateUser([], db, io, 1_000)).toBe(2);
    expect(err.join("\n")).toContain("Informe o usuário");
    expect(countUsers(db)).toBe(0);
  });

  it("recusa senha com menos de 12 caracteres, diz o motivo e não grava nada", async () => {
    const db = openDatabase(":memory:");
    const { io, err } = fakeIo({ interactive: false, stdin: "onze-chars1" });
    expect(await runCreateUser(["dono"], db, io, 1_000)).toBe(1);
    expect(err.join("\n")).toContain("pelo menos 12 caracteres");
    expect(countUsers(db)).toBe(0);
  });

  it("rodar de novo para o mesmo usuário troca a senha", async () => {
    const db = openDatabase(":memory:");
    await runCreateUser(["dono"], db, fakeIo({ interactive: false, stdin: "senha-longa-123" }).io, 1_000);
    const second = fakeIo({ interactive: false, stdin: "outra-senha-456" });
    expect(await runCreateUser(["dono"], db, second.io, 2_000)).toBe(0);
    expect(second.out.join("\n")).toContain("Senha de");
    expect(verifyCredentials(db, "dono", "outra-senha-456")).toBe(true);
    expect(verifyCredentials(db, "dono", "senha-longa-123")).toBe(false);
  });

  it("--help mostra o uso e não mexe no banco", async () => {
    const db = openDatabase(":memory:");
    const { io, out } = fakeIo({ interactive: false });
    expect(await runCreateUser(["--help"], db, io, 1_000)).toBe(0);
    expect(out.join("\n")).toContain("Uso: create-user");
    expect(countUsers(db)).toBe(0);
  });
});
