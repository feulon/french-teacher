import Link from "next/link";
import { Icon } from "../Icon";
import { ExerciseBar } from "./ExerciseBar";
import { Fiche } from "./Fiche";
import styles from "./exercise.module.css";

type StepDoneProps = {
  /** Aula de origem, no canto da ficha. */
  source: string;
  /** Total da barra: a etapa aparece completa. */
  total: number;
  summary: string;
  detail: string;
};

export function StepDone({ source, total, summary, detail }: StepDoneProps) {
  return (
    <>
      <ExerciseBar resolved={total} total={total} label="Etapa concluída" />
      <section className={styles.task}>
        <div>
          <p className="eyebrow">Etapa concluída</p>
          <h1 className={`display ${styles.title}`}>Muito bem.</h1>
        </div>
        <Fiche top={["Resumo", source]}>
          <div className={styles.lines}>
            <p>
              <b>{summary}</b>
            </p>
            <p>{detail}</p>
          </div>
        </Fiche>
      </section>
      <div className={`${styles.dock} ${styles.dockStack}`}>
        <Link href="/aula" className="btn btn-primary">
          Continuar <Icon name="arrow" />
        </Link>
        <Link href="/" className="btn btn-ghost">
          Voltar para Hoje
        </Link>
      </div>
    </>
  );
}
