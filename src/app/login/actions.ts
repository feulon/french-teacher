"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export type LoginState = { error: string | null };

const MAX_FIELD_LENGTH = 200;
const INVALID_CREDENTIALS = "Usuário ou senha incorretos.";

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof username !== "string" || username.trim() === "") {
    return { error: "Digite o usuário." };
  }
  if (typeof password !== "string" || password === "") {
    return { error: "Digite a senha." };
  }
  if (username.length > MAX_FIELD_LENGTH || password.length > MAX_FIELD_LENGTH) {
    return { error: INVALID_CREDENTIALS };
  }

  const result = await login(username, password);
  if (result.ok) redirect("/");

  if (result.reason === "rate-limited") {
    const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
    return { error: `Muitas tentativas. Tente de novo em ${minutes} min.` };
  }
  return { error: INVALID_CREDENTIALS };
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}
