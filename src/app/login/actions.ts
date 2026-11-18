"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export type LoginState = { error: string | null };

const MAX_PASSWORD_LENGTH = 200;

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || password === "") {
    return { error: "Digite a senha." };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { error: "Senha incorreta." };
  }

  const result = await login(password);
  if (result.ok) redirect("/");

  if (result.reason === "rate-limited") {
    const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
    return { error: `Muitas tentativas. Tente de novo em ${minutes} min.` };
  }
  return { error: "Senha incorreta." };
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}
