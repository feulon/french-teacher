import styles from "./ComingSoon.module.css";
import Link from "next/link";

type ComingSoonProps = { title: string; description: string };

// Tela ainda não construída: diz isso com clareza e leva de volta para Hoje.
export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="screen">
      <div className={styles.wrap}>
        <article className={styles.page}>
          <div className={styles.body}>
            <p className="eyebrow">Em breve</p>
            <h1 className={`display ${styles.title}`}>{title}</h1>
            <p className={styles.text}>{description}</p>
            <Link href="/" className={`btn btn-ghost ${styles.back}`}>
              Voltar para Hoje
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
