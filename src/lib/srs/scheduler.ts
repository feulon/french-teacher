// Repetição espaçada no estilo SM-2 com passos de aprendizado (como o Anki).
// Funções puras: recebem o cartão e o instante e devolvem o próximo estado.
// Nada aqui toca o banco, o relógio ou o fuso horário.

export const GRADES = ["again", "hard", "good", "easy"] as const;
export type Grade = (typeof GRADES)[number];

export function isGrade(value: unknown): value is Grade {
  return typeof value === "string" && (GRADES as readonly string[]).includes(value);
}

export type CardState = "new" | "learning" | "review" | "relearning";

export type CardSnapshot = {
  readonly state: CardState;
  /** Posição nos passos de aprendizado (só vale em learning e relearning). */
  readonly step: number;
  /** Intervalo atual, em dias inteiros (só vale em review; em relearning guarda o que volta depois). */
  readonly intervalDays: number;
  readonly ease: number;
  readonly reps: number;
  readonly lapses: number;
  /** Quando o cartão vence, em segundos desde 1970. */
  readonly due: number;
};

const MINUTE = 60;
export const DAY = 24 * 60 * MINUTE;

export const LEARNING_STEPS_MIN: readonly number[] = [1, 10];
export const RELEARNING_STEPS_MIN: readonly number[] = [10];
export const GRADUATING_INTERVAL_DAYS = 1;
export const EASY_INTERVAL_DAYS = 4;
export const START_EASE = 2.5;
export const MIN_EASE = 1.3;
export const HARD_INTERVAL_FACTOR = 1.2;
export const EASY_BONUS = 1.3;
export const LAPSE_INTERVAL_FACTOR = 0.5;
export const MAX_INTERVAL_DAYS = 365;

export function newCard(now: number): CardSnapshot {
  return { state: "new", step: 0, intervalDays: 0, ease: START_EASE, reps: 0, lapses: 0, due: now };
}

const clampInterval = (days: number) => Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(days)));
const clampEase = (ease: number) => Math.max(MIN_EASE, Math.round(ease * 100) / 100);

function stepsFor(state: CardState): readonly number[] {
  return state === "relearning" ? RELEARNING_STEPS_MIN : LEARNING_STEPS_MIN;
}

function inSteps(card: CardSnapshot, step: number, ease: number, now: number, steps: readonly number[]) {
  return {
    ...card,
    state: card.state === "relearning" ? ("relearning" as const) : ("learning" as const),
    step,
    ease,
    reps: card.reps + 1,
    due: now + steps[step] * MINUTE,
  };
}

function graduate(card: CardSnapshot, intervalDays: number, now: number): CardSnapshot {
  const interval = clampInterval(intervalDays);
  return { ...card, state: "review", step: 0, intervalDays: interval, reps: card.reps + 1, due: now + interval * DAY };
}

function gradeLearning(card: CardSnapshot, grade: Grade, now: number): CardSnapshot {
  const steps = stepsFor(card.state);
  const relearning = card.state === "relearning";
  const step = Math.min(card.step, steps.length - 1);

  if (grade === "again") return inSteps(card, 0, card.ease, now, steps);

  if (grade === "hard") {
    // No primeiro passo, "difícil" espera a média entre o 1º e o 2º passo.
    const first = step === 0 && steps.length > 1;
    const minutes = first ? Math.ceil((steps[0] + steps[1]) / 2) : steps[step];
    return { ...inSteps(card, step, card.ease, now, steps), due: now + minutes * MINUTE };
  }

  if (grade === "good") {
    if (step + 1 < steps.length) return inSteps(card, step + 1, card.ease, now, steps);
    return graduate(card, relearning ? card.intervalDays : GRADUATING_INTERVAL_DAYS, now);
  }

  return graduate(card, relearning ? Math.max(card.intervalDays + 1, 2) : EASY_INTERVAL_DAYS, now);
}

function gradeReview(card: CardSnapshot, grade: Grade, now: number): CardSnapshot {
  if (grade === "again") {
    return {
      ...card,
      state: "relearning",
      step: 0,
      lapses: card.lapses + 1,
      ease: clampEase(card.ease - 0.2),
      intervalDays: clampInterval(card.intervalDays * LAPSE_INTERVAL_FACTOR),
      reps: card.reps + 1,
      due: now + RELEARNING_STEPS_MIN[0] * MINUTE,
    };
  }

  // Cada nota rende pelo menos 1 dia a mais que a anterior, mesmo com intervalos curtos.
  const hard = clampInterval(Math.max(card.intervalDays + 1, card.intervalDays * HARD_INTERVAL_FACTOR));
  const good = clampInterval(Math.max(hard + 1, card.intervalDays * card.ease));
  const easy = clampInterval(Math.max(good + 1, card.intervalDays * card.ease * EASY_BONUS));

  if (grade === "hard") return { ...graduate(card, hard, now), ease: clampEase(card.ease - 0.15) };
  if (grade === "good") return graduate(card, good, now);
  return { ...graduate(card, easy, now), ease: clampEase(card.ease + 0.15) };
}

/** Estado do cartão depois de dar a nota `grade` no instante `now` (segundos). */
export function schedule(card: CardSnapshot, grade: Grade, now: number): CardSnapshot {
  return card.state === "review" ? gradeReview(card, grade, now) : gradeLearning(card, grade, now);
}

/** Quanto tempo (em segundos) cada nota empurra o próximo vencimento. Alimenta os botões. */
export function previewDelays(card: CardSnapshot, now: number): Record<Grade, number> {
  const delay = (grade: Grade) => schedule(card, grade, now).due - now;
  return { again: delay("again"), hard: delay("hard"), good: delay("good"), easy: delay("easy") };
}
