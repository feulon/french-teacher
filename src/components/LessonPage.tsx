import type { Lesson } from "@/lib/lesson";
import { totalMinutes } from "@/lib/lesson";
import { Icon } from "./Icon";
import styles from "./LessonPage.module.css";

export function LessonPage({ lesson }: { lesson: Lesson }) {
  return (
    <article className={styles.page}>
      <div className={styles.head}>
        <p className="eyebrow">Aula de hoje · {totalMinutes(lesson)} min</p>
        <h1 className={`display ${styles.title}`}>{lesson.title}</h1>
        <p className={styles.meta}>
          Capítulo 1 · {lesson.chapter} &nbsp;·&nbsp; Aula {lesson.lessonNumber} de {lesson.lessonCount}
        </p>
      </div>
      <ol className={styles.steps}>
        {lesson.steps.map((step, index) => (
          <li key={step.id} className={styles.step}>
            <span className={styles.icon}>
              <Icon name={step.icon} size={21} />
            </span>
            <span className={styles.label}>
              {index === 0 ? <em className={styles.next}>{step.label}</em> : step.label}
            </span>
            <span className={styles.min}>{step.minutes} min</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
