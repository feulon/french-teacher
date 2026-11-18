"use client";

import { useActionState } from "react";
import { Icon } from "@/components/Icon";
import { loginAction, type LoginState } from "./actions";
import styles from "./login.module.css";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className={styles.form}>
      <label className={styles.label} htmlFor="password">
        Senha
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        enterKeyHint="go"
        required
        className={styles.input}
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "login-error" : undefined}
      />
      {state.error ? (
        <p id="login-error" role="alert" className={styles.error}>
          <Icon name="alert" size={20} />
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
