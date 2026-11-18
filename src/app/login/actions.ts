"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";
import { MAX_FIELD_LENGTH } from "@/lib/users";

// `username` devolve o que foi digitado: o React limpa o formulário depois da ação,
// e no celular ninguém quer redigitar o usuário a cada senha errada.
export type LoginState = { error: string | null; username: string };

const INVALID_CREDENTIALS = "Usuário ou senha incorretos.";

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof username !== "string" || username.trim() === "") {
    return { error: "Digite o usuário.", username: "" };
  }
  if (typeof password !== "string" || password === "") {
    return { error: "Digite a senha.", username };
  }
  if (username.length > MAX_FIELD_LENGTH || password.length > MAX_FIELD_LENGTH) {
    return { error: INVALID_CREDENTIALS, username };
  }

  const result = await login(username, password);
  if (result.ok) redirect("/");

  if (result.reason === "rate-limited") {
    const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
    return { error: `Muitas tentativas. Tente de novo em ${minutes} min.`, username };
  }
  return { error: INVALID_CREDENTIALS, username };
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}
