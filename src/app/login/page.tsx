import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasValidSession } from "@/lib/auth";
import { greeting } from "@/lib/lesson";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await hasValidSession()) redirect("/");
  return (
    <main className="shell">
      <div className={`screen ${styles.screen}`}>
        <p className={`hand ${styles.greet}`}>{greeting}</p>
        <article className={styles.page}>
          <div className={styles.body}>
            <p className="eyebrow">Acesso</p>
            <h1 className={`display ${styles.title}`}>Entrar</h1>
            <LoginForm />
          </div>
        </article>
      </div>
    </main>
  );
}
