import type { Db } from "./db";
import { MIN_PASSWORD_LENGTH, saveUser } from "./users";

export type CliIo = {
  // true quando há um terminal interativo (pergunta usuário e senha, a senha sem eco).
  readonly interactive: boolean;
  prompt(label: string, options: { hidden: boolean }): Promise<string>;
  // Fora de um terminal (pipe), a senha vem da primeira linha da entrada padrão.
  readPasswordFromStdin(): Promise<string>;
  out(line: string): void;
  err(line: string): void;
};

export const USAGE = `Uso: create-user [usuário]

Cadastra um usuário ou, se ele já existe, troca a senha (e encerra as sessões abertas).
A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres e é guardada só como hash.

  Interativo:  docker compose exec -it app node create-user.mjs
  Por pipe:    printf '%s\\n' "$SENHA" | docker compose exec -T app node create-user.mjs usuario`;

// Devolve o código de saída do processo.
export async function runCreateUser(args: readonly string[], db: Db, io: CliIo, now: number): Promise<number> {
  if (args.includes("-h") || args.includes("--help")) {
    io.out(USAGE);
    return 0;
  }
  if (args.length > 1) {
    io.err(USAGE);
    return 2;
  }

  let username = args[0] ?? "";
  let password: string;
  if (io.interactive) {
    if (username === "") username = await io.prompt("Usuário: ", { hidden: false });
    password = await io.prompt("Senha: ", { hidden: true });
    if (password !== (await io.prompt("Repita a senha: ", { hidden: true }))) {
      io.err("As senhas não são iguais. Nada foi alterado.");
      return 1;
    }
  } else {
    if (username === "") {
      io.err("Informe o usuário como argumento quando a senha vem por pipe.\n\n" + USAGE);
      return 2;
    }
    password = await io.readPasswordFromStdin();
  }

  const result = saveUser(db, username, password, now);
  if (!result.ok) {
    io.err(`${result.error} Nada foi alterado.`);
    return 1;
  }
  io.out(
    result.created
      ? `Usuário "${username.trim()}" cadastrado.`
      : `Senha de "${username.trim()}" trocada; as sessões abertas foram encerradas.`,
  );
  return 0;
}
