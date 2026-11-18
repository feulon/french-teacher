import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { requireSession } from "@/lib/auth";
import { describeWhen } from "@/lib/relative-time";
import { cardsOverview } from "@/lib/study";
import { studyContext } from "@/lib/study-context";
import styles from "./cartoes.module.css";

export const metadata: Metadata = { title: "Cartões" };

export default async function Page() {
  await requireSession();
  const ctx = studyContext();
  const { counts, dueNow, nextDue } = cardsOverview(ctx);

  const rows = [
    { label: "Novos", hint: "ainda não vistos", value: counts.new },
    { label: "Aprendendo", hint: "primeiros passos", value: counts.learning },
    { label: "Para revisar hoje", hint: "vencem hoje", value: counts.dueToday },
  ] as const;

  const later =
    counts.later === 0 ? "" : ` ${counts.later} ${counts.later === 1 ? "agendado" : "agendados"} para os próximos dias.`;
  const footnote =
    counts.new === counts.total
      ? "Você ainda não viu nenhuma palavra. Comece por Palavras novas, na aula de hoje."
      : nextDue === null
        ? `${counts.total} cartões no total.${later}`
        : `${counts.total} cartões no total.${later} Próximo vencimento: ${describeWhen(nextDue, ctx.now, ctx.timeZone)}.`;

  return (
    <>
      <section className="screen">
        <div className={styles.wrap}>
          <article className={styles.page}>
            <div className={styles.head}>
              <p className="eyebrow">Repetição espaçada</p>
              <h1 className={`display ${styles.title}`}>Cartões</h1>
              <p className={styles.meta}>Cada cartão volta na hora de você esquecer.</p>
            </div>
            <ul className={styles.rows}>
              {rows.map((row) => (
                <li key={row.label} className={styles.row}>
                  <span className={styles.label}>
                    {row.label}
                    <small>{row.hint}</small>
                  </span>
                  <b className={`display ${styles.value}`}>{row.value}</b>
                </li>
              ))}
            </ul>
            <p className={styles.foot}>{footnote}</p>
          </article>
        </div>
      </section>
      <div className="dock">
        {dueNow > 0 ? (
          <Link href="/aula/revisar" className="btn btn-primary">
            Revisar {dueNow} {dueNow === 1 ? "cartão" : "cartões"} agora <Icon name="arrow" />
          </Link>
        ) : (
          <Link href="/" className="btn btn-ghost">
            Voltar para Hoje
          </Link>
        )}
      </div>
    </>
  );
}
