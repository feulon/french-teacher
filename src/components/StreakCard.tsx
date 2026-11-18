import type { WeekDay } from "@/lib/lesson";
import { Icon } from "./Icon";
import styles from "./StreakCard.module.css";

type StreakCardProps = { days: number; studiedToday: boolean; week: readonly WeekDay[] };

const STATE_LABEL = { done: "estudou", today: "hoje, ainda sem estudo", missed: "sem estudo", upcoming: "ainda não" } as const;

function headline(days: number): string {
  if (days === 0) return "Comece sua sequência";
  return days === 1 ? "1 dia seguido" : `${days} dias seguidos`;
}

function caption(days: number, studiedToday: boolean): string {
  if (studiedToday) return "Hoje já conta na sequência.";
  return days > 0 ? "Estude hoje para manter a sequência." : "Estude hoje para começar a sequência.";
}

export function StreakCard({ days, studiedToday, week }: StreakCardProps) {
  return (
    <section className={styles.streak} aria-label="Sequência de estudo">
      <div className={styles.stamp} aria-hidden="true">
        <b>{days}</b>
        <span>{days === 1 ? "DIA" : "DIAS"}</span>
      </div>
      <div>
        <h2 className={`display ${styles.title}`}>{headline(days)}</h2>
        <p className={styles.text}>{caption(days, studiedToday)}</p>
      </div>
      <ol className={styles.week} aria-label="Semana">
        {week.map((day) => (
          <li key={day.day} className={styles.day}>
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
