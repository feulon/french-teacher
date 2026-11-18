# french-teacher

Plataforma pessoal para aprender francês, mobile first (PWA, em português).

Stack: Next.js (App Router) com SQLite via `node:sqlite`, em um único container. Foi escolhida por precisar de um só processo, sem dependências nativas e sem serviço de banco separado.

## Rodar em desenvolvimento

Requer Node 22.13 ou mais novo.

```bash
npm install
cp .env.example .env   # preencha APP_USERNAME e APP_PASSWORD (mín. 12 caracteres; ex.: openssl rand -base64 18)
npm run dev            # http://localhost:3000
```

O Next carrega o `.env` sozinho. Os dados ficam em `./data`.

Outros comandos: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

## Rodar em Docker

```bash
cp .env.example .env   # preencha APP_USERNAME e APP_PASSWORD (mín. 12 caracteres; ex.: openssl rand -base64 18)
docker compose up -d --build
```

Passo a passo completo, com o Cloudflare Tunnel: [docs/deploy.md](docs/deploy.md).
