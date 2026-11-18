import Link from "next/link";
import { totalMinutes, type TodayLesson, type TodayStep } from "@/lib/lesson";
import { Icon } from "./Icon";
import styles from "./LessonPage.module.css";

// O que aparece no lugar dos minutos quando a etapa não é "a fazer".
const SIDE_NOTE = { done: "feito", empty: "nada agora", soon: "em breve" } as const;

function StepRow({ step, highlighted }: { step: TodayStep; highlighted: boolean }) {
  const content = (
    <>
      <span className={styles.icon}>
        <Icon name={step.status === "done" ? "check" : step.icon} size={21} />
      </span>
      <span className={styles.label}>
        {highlighted ? <em className={styles.next}>{step.label}</em> : step.label}
      </span>
      <span className={styles.min}>
        {step.status === "pending" ? `${step.minutes} min` : SIDE_NOTE[step.status]}
      </span>
    </>
  );
  const className = `${styles.row} ${step.status === "pending" ? "" : styles.quiet}`;
  return (
    <li className={styles.step}>
      {step.href ? (
        <Link href={step.href} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}

export function LessonPage({ today }: { today: TodayLesson }) {
  const { lesson, steps, nextHref } = today;
  return (
    <article className={styles.page}>
      <div className={styles.head}>
        <p className="eyebrow">Aula de hoje · {totalMinutes(lesson)} min</p>
        <h1 className={`display ${styles.title}`}>{lesson.title}</h1>
        <p className={styles.meta}>
          Capítulo {lesson.chapter.number} · {lesson.chapter.title} &nbsp;·&nbsp; Aula {lesson.number} de{" "}
          {lesson.chapter.lessonCount}
        </p>
      </div>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <StepRow key={step.id} step={step} highlighted={nextHref !== null && step.href === nextHref} />
        ))}
      </ol>
    </article>
  );
}
