import { getConfig } from "./config";
import { getDb } from "./db";
import { countUsers } from "./users";

// Valida a configuração e abre o banco na subida. Se algo estiver errado,
// escreve o motivo e encerra o processo: o container reinicia e o erro fica
// visível em `docker compose logs`, em vez de aparecer só no primeiro login.
// Sem nenhum usuário o app sobe mesmo assim (é preciso estar no ar para
// cadastrar um com `docker compose exec`); o aviso fica no log.
export function checkStartup(): void {
  try {
    getConfig();
    if (countUsers(getDb()) === 0) {
      console.warn(
        "Nenhum usuário cadastrado, então ninguém consegue entrar. Cadastre um com: docker compose exec -it app node create-user.mjs",
      );
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Não foi possível iniciar: ${reason}`);
    process.exit(1);
  }
}
