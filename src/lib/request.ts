import type { CookieSecure } from "./config";

type HeaderReader = { get(name: string): string | null };

// Atrás do Cloudflare Tunnel o IP real vem em CF-Connecting-IP; sem ele, o
// primeiro item de X-Forwarded-For. Os dois podem ser forjados quando o app é
// acessado direto, então o limite de tentativas (só por IP) pode ser contornado
// por quem forja o cabeçalho; a defesa restante é a senha longa (mínimo de 12
// caracteres).
export function clientIp(headers: HeaderReader): string {
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return "desconhecido";
}

// "auto" marca o cookie como Secure quando a requisição chegou por HTTPS
// (o túnel envia X-Forwarded-Proto: https); assim o acesso por http na rede
// local, durante a instalação, também funciona.
export function cookieShouldBeSecure(headers: HeaderReader, mode: CookieSecure): boolean {
  if (mode === "true") return true;
  if (mode === "false") return false;
  const proto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return proto === "https";
}
