import { formatDelay } from "@/lib/srs/format";
import type { Grade } from "@/lib/srs/scheduler";
import styles from "./exercise.module.css";

const BUTTONS: readonly { grade: Grade; label: string; className: string }[] = [
  { grade: "again", label: "De novo", className: styles.g1 },
  { grade: "hard", label: "Difícil", className: styles.g2 },
  { grade: "good", label: "Bom", className: styles.g3 },
  { grade: "easy", label: "Fácil", className: styles.g4 },
];

type GradeButtonsProps = {
  /** Segundos até o próximo vencimento para cada nota (o intervalo mostrado no botão). */
  delays: Record<Grade, number>;
  disabled: boolean;
  onGrade: (grade: Grade) => void;
};

export function GradeButtons({ delays, disabled, onGrade }: GradeButtonsProps) {
  return (
    <>
      <p className={styles.ask}>Quão bem você lembrou?</p>
      <div className={styles.grade}>
        {BUTTONS.map(({ grade, label, className }) => (
          <button
            key={grade}
            type="button"
            className={className}
            disabled={disabled}
            aria-label={`${label}, volta em ${formatDelay(delays[grade])}`}
            onClick={() => onGrade(grade)}
          >
            {label}
            <small>{formatDelay(delays[grade])}</small>
          </button>
        ))}
      </div>
    </>
  );
}
