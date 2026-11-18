import Link from "next/link";
import { Icon } from "../Icon";
import { ExerciseBar } from "./ExerciseBar";
import { Fiche } from "./Fiche";
import styles from "./exercise.module.css";

type EmptyStepProps = {
  eyebrow: string;
  title: string;
  /** Parágrafos curtos, uma ideia em cada. */
  lines: readonly string[];
  top: readonly [string, string];
  action: { href: string; label: string };
  secondary?: { href: string; label: string };
};

// Estado vazio honesto: diz por que não há nada e para onde ir.
export function EmptyStep({ eyebrow, title, lines, top, action, secondary }: EmptyStepProps) {
  return (
    <>
      <ExerciseBar resolved={0} total={0} label={eyebrow} />
      <section className={styles.task}>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className={`display ${styles.title}`}>{title}</h1>
        </div>
        <Fiche top={top}>
          <div className={styles.lines}>
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </Fiche>
      </section>
      <div className={`${styles.dock} ${styles.dockStack}`}>
        <Link href={action.href} className="btn btn-primary">
          {action.label} <Icon name="arrow" />
        </Link>
        {secondary ? (
          <Link href={secondary.href} className="btn btn-ghost">
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </>
  );
}
