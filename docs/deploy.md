# Subir no servidor

Passo a passo para rodar o app em Docker no servidor local e, depois, publicá-lo com o Cloudflare Tunnel. Este documento não contém credenciais: elas ficam só no seu `.env` e no painel da Cloudflare.

## 1. Pré-requisitos

- Docker com o plugin Compose (`docker compose version`).
- Um clone deste repositório no servidor.

## 2. Configurar

```bash
cp .env.example .env
```

O `.env` só traz ajustes opcionais (fuso, porta, cookie). Usuário e senha não ficam nele: são cadastrados no passo 4, pelo terminal.

## 3. Subir

```bash
docker compose up -d --build
docker compose ps          # a coluna STATUS deve ficar "healthy"
docker compose logs -f app
```

Por padrão o app escuta só em `127.0.0.1:3000` do servidor. Para testar pelo celular na rede local antes do túnel, ponha `BIND_ADDRESS=0.0.0.0` no `.env`, rode `docker compose up -d` de novo e abra `http://IP-DO-SERVIDOR:3000`. Por `http` o login funciona (com `COOKIE_SECURE=auto` o cookie só recebe a flag `Secure` quando o acesso chega por HTTPS), mas o navegador não oferece instalar o app: isso só vale por HTTPS, depois do túnel. Volte para `127.0.0.1` quando o túnel estiver no ar.

Os dados (banco SQLite com o usuário e o hash da senha, as sessões e as tentativas de login) ficam no volume Docker `french-teacher-data`, montado em `/data`, e sobrevivem a `docker compose down` e a atualizações da imagem.

## 4. Cadastrar o usuário e a senha

Com o container no ar, cadastre o usuário (o app não tem cadastro pela página):

```bash
docker compose exec -it app node create-user.mjs
```

O comando pergunta o usuário e a senha (duas vezes, sem mostrar o que você digita). A senha precisa ter **pelo menos 12 caracteres**; o comando recusa as menores e não grava nada. Para gerar uma: `openssl rand -base64 18`. A senha é gravada só como hash (scrypt com sal) no SQLite do volume `/data`; ela não fica em arquivo nem em variável de ambiente.

Sem terminal interativo (script), passe o usuário como argumento e a senha por pipe:

```bash
printf '%s\n' "$SENHA" | docker compose exec -T app node create-user.mjs usuario
```

Rodar o comando de novo com o mesmo usuário troca a senha e encerra as sessões abertas, então serve também para recuperar o acesso se você esquecer a senha. Não use `exec -u root`: o banco pertence ao usuário `node`. Enquanto nenhum usuário existir, o log do container avisa isso e ninguém consegue entrar.

## 5. Cloudflare Tunnel

Pré-requisito: um domínio com DNS na Cloudflare. O `cloudflared` roda no servidor e abre uma conexão de saída até a Cloudflare, então não é preciso abrir portas no roteador.

1. No painel Cloudflare, abra **Zero Trust > Networks > Tunnels** e crie um túnel do tipo **Cloudflared**. Dê um nome (por exemplo `french-teacher`).
2. Escolha o seu sistema e instale o `cloudflared` no servidor com os comandos que o painel mostra (o token do túnel aparece lá; não o salve no repositório).
3. Na aba **Public Hostname** do túnel, adicione:
   - Subdomain e domain: o endereço que você quer, por exemplo `frances.seudominio.com`.
   - Service: **HTTP**, URL `localhost:3000` (use a porta de `HOST_PORT`, se mudou).
4. Aguarde o túnel ficar **Healthy** no painel e abra `https://frances.seudominio.com`.

Se o `cloudflared` rodar como container no mesmo Compose ou em outra rede Docker, troque `localhost:3000` por `http://app:3000` e coloque os dois serviços na mesma rede.

O Cloudflare Tunnel entrega `X-Forwarded-Proto: https` e `CF-Connecting-IP`; o app usa o primeiro para marcar o cookie como `Secure` e o segundo para o limite de tentativas de login (5 erros por IP em 15 minutos; o limite é só por IP, então a defesa contra troca de IP é a senha longa).

## 6. Instalar no celular

Abra o endereço HTTPS no navegador do celular, entre com o usuário e a senha e use **Adicionar à tela inicial** (iOS: Compartilhar > Adicionar à Tela de Início; Android: menu do Chrome > Instalar app).

## 7. Atualizar, parar, backup

```bash
git pull
docker compose up -d --build     # atualiza mantendo os dados

docker compose down              # para (o volume continua)
docker compose down -v           # para e APAGA os dados

# backup do banco
docker compose cp app:/data ./backup-data
```
