import type { WeekDay } from "@/lib/lesson";
import { Icon } from "./Icon";
import styles from "./StreakCard.module.css";

type StreakCardProps = { days: number; week: readonly WeekDay[] };

const STATE_LABEL = { done: "feito", today: "hoje", upcoming: "ainda não" } as const;

export function StreakCard({ days, week }: StreakCardProps) {
  return (
    <section className={styles.streak} aria-label="Sequência de estudo">
      <div className={styles.stamp} aria-hidden="true">
        <b>{days}</b>
        <span>DIAS</span>
      </div>
      <div>
        <h2 className={`display ${styles.title}`}>{days} dias seguidos</h2>
        <p className={styles.text}>Mais uma aula mantém a sequência.</p>
      </div>
      <ol className={styles.week} aria-label="Semana">
        {week.map((day) => (
          <li key={day.name} className={styles.day}>
            <span aria-hidden="true">{day.letter}</span>
            <span
              className={`${styles.dot} ${day.state === "done" ? styles.done : ""} ${
                day.state === "today" ? styles.today : ""
              }`}
              role="img"
              aria-label={`${day.name}: ${STATE_LABEL[day.state]}`}
            >
              {day.state === "done" ? <Icon name="check" size={16} /> : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
