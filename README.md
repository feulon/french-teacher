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
