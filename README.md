# french-teacher

Plataforma pessoal para aprender francês, mobile first (PWA, em português).

Stack: Next.js (App Router) com SQLite via `node:sqlite`, em um único container. Foi escolhida por precisar de um só processo, sem dependências nativas e sem serviço de banco separado.

## Rodar em desenvolvimento

Requer Node 22.13 ou mais novo.

```bash
npm install
cp .env.example .env
npm run create-user    # cadastra o usuário e a senha (mín. 12 caracteres); fica em ./data
npm run dev            # http://localhost:3000
```

O Next carrega o `.env` sozinho. Os dados ficam em `./data`.

Outros comandos: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

## Aulas, cartões e progresso

O conteúdo fica em arquivos versionados, não nos componentes: cada aula é um JSON em `src/content/chapters/` (hoje, `01-bonjour/aula-01.json`, a aula 1 do capítulo 1). Cada item tem francês, pronúncia aproximada em português, IPA, tradução e uma frase de exemplo. Para montar uma aula nova, crie o JSON ao lado e registre-o em `src/content/index.ts`; `src/lib/content.ts` valida o formato e um arquivo malformado derruba o build e os testes.

O progresso fica no SQLite (`cards`, `reviews`, `step_completions`, `study_days`). A repetição espaçada é um SM-2 com passos de aprendizado de 1 e 10 minutos (`src/lib/srs/`); os 4 botões (De novo, Difícil, Bom, Fácil) mostram o próximo intervalo. A sequência (streak) conta os dias em que houve alguma nota ou etapa concluída, no fuso de `TZ`.

O áudio usa a voz do navegador em fr-FR (Web Speech API). Sem voz em francês instalada no aparelho, a tela avisa em vez de ler com sotaque errado. A gravação de fala, Escrever e Conversar com a IA ainda aparecem como "em breve".

## Usuário e senha

Não há cadastro pela página nem usuário em variável de ambiente. O usuário e a senha são cadastrados pelo terminal e a senha fica no SQLite só como hash (scrypt com sal). Depois o login é feito pela página, com usuário e senha.

- Em desenvolvimento: `npm run create-user`.
- No container: `docker compose exec -it app node create-user.mjs`.
- Sem terminal interativo, a senha vem por pipe e o usuário como argumento: `printf '%s\n' "$SENHA" | docker compose exec -T app node create-user.mjs usuario`.

A senha precisa ter pelo menos 12 caracteres (o comando recusa as menores; gere uma com `openssl rand -base64 18`). Rodar o comando de novo com o mesmo usuário troca a senha e encerra as sessões abertas. O login tem limite só por IP: 5 erros em 15 minutos bloqueiam aquele IP; erros de outros IPs nunca bloqueiam o login certo. A defesa contra quem troca de IP é a senha longa.

## Rodar em Docker

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec -it app node create-user.mjs    # cadastra o usuário e a senha
```

Passo a passo completo, com o Cloudflare Tunnel: [docs/deploy.md](docs/deploy.md).
