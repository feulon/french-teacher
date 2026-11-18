import { logoutAction } from "@/app/login/actions";
import { greeting } from "@/lib/lesson";
import styles from "./TodayHeader.module.css";

export function TodayHeader({ date }: { date: string }) {
  return (
    <header className={styles.hello}>
      <p className={`hand ${styles.greet}`}>{greeting}</p>
      <div className={styles.side}>
        <p className={styles.date}>{date}</p>
        <span className={styles.date} aria-hidden="true">
          ·
        </span>
        <form action={logoutAction}>
          <button type="submit" className={styles.logout}>
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
