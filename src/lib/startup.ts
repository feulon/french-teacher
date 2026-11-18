import { getDb } from "./db";

// Valida a configuração e abre o banco na subida. Se algo estiver errado,
// escreve o motivo e encerra o processo: o container reinicia e o erro fica
// visível em `docker compose logs`, em vez de aparecer só no primeiro login.
export function checkStartup(): void {
  try {
    getDb();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Não foi possível iniciar: ${reason}`);
    process.exit(1);
  }
}
