import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getConfig } from "./config";
import { getDb } from "./db";
import { attemptLogin, type LoginResult } from "./login";
import { createPasswordVerifier } from "./password";
import { clientIp, cookieShouldBeSecure } from "./request";
import { SESSION_TTL_SECONDS, deleteSession, findSession } from "./session";

export const SESSION_COOKIE = "ft_session";

const nowSeconds = () => Math.floor(Date.now() / 1000);

let verifier: ((candidate: string) => boolean) | undefined;
function getVerifier() {
  verifier ??= createPasswordVerifier(getConfig().password);
  return verifier;
}

export async function hasValidSession(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  return findSession(getDb(), token, nowSeconds());
}

// Chamada no topo de cada página protegida.
export async function requireSession(): Promise<void> {
  if (!(await hasValidSession())) redirect("/login");
}

export async function login(password: string): Promise<LoginResult> {
  const requestHeaders = await headers();
  const result = attemptLogin({
    db: getDb(),
    verify: getVerifier(),
    password,
    ip: clientIp(requestHeaders),
    now: nowSeconds(),
  });
  if (result.ok) {
    (await cookies()).set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieShouldBeSecure(requestHeaders, getConfig().cookieSecure),
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
  }
  return result;
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(getDb(), token);
  jar.delete(SESSION_COOKIE);
}
