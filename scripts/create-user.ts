// Comando de cadastro de usuário. Em desenvolvimento: `npm run create-user`.
// No container: `docker compose exec -it app node create-user.mjs` (o Dockerfile
// empacota este arquivo como /app/create-user.mjs).
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { getDb } from "../src/lib/db";
import { runCreateUser, type CliIo } from "../src/lib/create-user-cli";

let echo = true;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (echo) process.stdout.write(chunk, encoding);
    callback();
  },
});

function createIo(): CliIo & { close(): void } {
  const interactive = Boolean(process.stdin.isTTY);
  const rl = createInterface({ input: process.stdin, output, terminal: interactive });
  const lines = rl[Symbol.asyncIterator]();
  return {
    interactive,
    // Lê pela mesma fila de linhas da leitura por pipe, para não perder linhas coladas de uma vez.
    prompt: async (label, { hidden }) => {
      process.stdout.write(label);
      echo = !hidden;
      const line = (await lines.next()).value ?? "";
      echo = true;
      if (hidden) process.stdout.write("\n");
      return line;
    },
    readPasswordFromStdin: async () => (await lines.next()).value ?? "",
    out: (line) => console.log(line),
    err: (line) => console.error(line),
    close: () => rl.close(),
  };
}

const io = createIo();
let code = 1;
try {
  code = await runCreateUser(process.argv.slice(2), getDb(), io, Math.floor(Date.now() / 1000));
} catch (error) {
  console.error(`Não foi possível cadastrar: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  io.close();
}
process.exit(code);
