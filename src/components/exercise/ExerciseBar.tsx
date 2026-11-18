import Link from "next/link";
import { Icon } from "../Icon";
import styles from "./exercise.module.css";

type ExerciseBarProps = {
  /** Itens já resolvidos. */
  resolved: number;
  total: number;
  /** Texto para leitores de tela, como "Palavra 2 de 6". */
  label: string;
};

const MAX_SEGMENTS = 12;

export function ExerciseBar({ resolved, total, label }: ExerciseBarProps) {
  const position = Math.min(resolved + 1, total);
  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.close} aria-label="Sair da aula (o que você já fez fica salvo)">
        <Icon name="close" />
      </Link>
      {total === 0 ? (
        <div className={styles.ticks} />
      ) : total <= MAX_SEGMENTS ? (
        <div className={styles.ticks} role="img" aria-label={label}>
          {Array.from({ length: total }, (_, index) => (
            <i key={index} className={index < resolved ? styles.on : index === resolved ? styles.now : undefined} />
          ))}
        </div>
      ) : (
        <div className={styles.track} role="img" aria-label={label}>
          <i style={{ width: `${(resolved / total) * 100}%` }} />
        </div>
      )}
      <span className={styles.count} aria-hidden="true">
        {total > 0 ? `${position}/${total}` : ""}
      </span>
    </header>
  );
}
