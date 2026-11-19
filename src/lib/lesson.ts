import type { Lesson, StepId } from "./content";
import { addDays, dayKey, weekdayIndexOf } from "./time";

// Espaço fino não separável: impede a quebra de linha antes de "!" em francês.
const NNBSP = " ";

export const greeting = `Bonjour${NNBSP}!`;

export type StepIcon = "repeat" | "book" | "mic" | "pencil" | "sparkle";

/**
 * pending: falta fazer · done: feito · empty: não há o que fazer agora (revisão
 * sem cartões vencidos) · soon: a etapa ainda não existe no app.
 */
export type StepStatus = "pending" | "done" | "empty" | "soon";

export type TodayStep = {
  readonly id: StepId;
  readonly label: string;
  readonly minutes: number;
  readonly icon: StepIcon;
  readonly status: StepStatus;
  /** Tela da etapa; null quando ela ainda não existe. */
  readonly href: string | null;
};

type StepMeta = { readonly icon: StepIcon; readonly href: string | null };

const STEP_META: Record<StepId, StepMeta> = {
  review: { icon: "repeat", href: "/aula/revisar" },
  words: { icon: "book", href: "/aula/palavras" },
  listen: { icon: "mic", href: "/aula/escutar" },
  write: { icon: "pencil", href: null },
  chat: { icon: "sparkle", href: null },
};

export function stepHref(id: StepId): string | null {
  return STEP_META[id].href;
}

export type TodayInputs = {
  readonly lesson: Lesson;
  /** Cartões vencidos agora. */
  readonly dueCount: number;
  /** Itens da aula que ainda não receberam nenhuma nota. */
  readonly newRemaining: number;
  /** Etapas concluídas hoje (revisar e escutar valem por dia). */
  readonly doneToday: ReadonlySet<string>;
  readonly studiedToday: boolean;
};

export type TodayLesson = {
  readonly lesson: Lesson;
  readonly steps: readonly TodayStep[];
  /** Onde "Começar a aula" leva; null quando não sobra nada a fazer hoje. */
  readonly nextHref: string | null;
  readonly phase: "fresh" | "started" | "finished";
};

function plural(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

function describeStep(id: StepId, input: TodayInputs): { label: string; status: StepStatus } {
  const { doneToday, dueCount, newRemaining, lesson } = input;
  switch (id) {
    case "review":
      if (doneToday.has("review")) return { label: "Cartões revisados", status: "done" };
      if (dueCount === 0) return { label: "Revisar cartões", status: "empty" };
      return { label: `Revisar ${plural(dueCount, "cartão", "cartões")}`, status: "pending" };
    case "words":
      if (newRemaining === 0) return { label: plural(lesson.items.length, "palavra nova", "palavras novas"), status: "done" };
      return { label: plural(newRemaining, "palavra nova", "palavras novas"), status: "pending" };
    case "listen":
      return { label: "Escutar e falar", status: doneToday.has("listen") ? "done" : "pending" };
    case "write":
      return { label: "Escrever", status: "soon" };
    case "chat":
      return { label: "Conversar com a IA", status: "soon" };
  }
}

export function buildTodayLesson(input: TodayInputs): TodayLesson {
  const steps = input.lesson.steps.map((plan): TodayStep => {
    const { label, status } = describeStep(plan.id, input);
    const { icon, href } = STEP_META[plan.id];
    return { id: plan.id, label, minutes: plan.minutes, icon, status, href };
  });
  const next = steps.find((step) => step.status === "pending");
  const started = input.doneToday.size > 0 || input.studiedToday;
  return {
    lesson: input.lesson,
    steps,
    nextHref: next?.href ?? null,
    phase: next === undefined ? "finished" : started ? "started" : "fresh",
  };
}

export function totalMinutes(lesson: Lesson): number {
  return lesson.steps.reduce((sum, step) => sum + step.minutes, 0);
}

export type WeekDayState = "done" | "today" | "missed" | "upcoming";
export type WeekDay = {
  readonly letter: string;
  readonly name: string;
  readonly day: string;
  readonly state: WeekDayState;
};

const WEEK = [
  { letter: "S", name: "segunda" },
  { letter: "T", name: "terça" },
  { letter: "Q", name: "quarta" },
  { letter: "Q", name: "quinta" },
  { letter: "S", name: "sexta" },
  { letter: "S", name: "sábado" },
  { letter: "D", name: "domingo" },
] as const;

/** Primeiro e último dia (segunda a domingo) da semana que contém `now`. */
export function weekRange(now: Date, timeZone: string): { from: string; to: string } {
  const today = dayKey(Math.floor(now.getTime() / 1000), timeZone);
  const from = addDays(today, -weekdayIndexOf(today));
  return { from, to: addDays(from, 6) };
}

/** A semana de segunda a domingo, com os dias estudados marcados. */
export function buildWeek(now: Date, timeZone: string, studied: ReadonlySet<string>): readonly WeekDay[] {
  const today = dayKey(Math.floor(now.getTime() / 1000), timeZone);
  const { from } = weekRange(now, timeZone);
  return WEEK.map((entry, index): WeekDay => {
    const day = addDays(from, index);
    const state: WeekDayState = studied.has(day)
      ? "done"
      : day === today
        ? "today"
        : day < today
          ? "missed"
          : "upcoming";
    return { ...entry, day, state };
  });
}

export function formatLongDate(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  })
    .format(now)
    .replace("-feira", "");
}
