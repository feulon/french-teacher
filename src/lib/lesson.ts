// Dados de exemplo fixos da fase 1. Nas próximas fases, isto vem do banco.

// Espaço fino não separável: impede a quebra de linha antes de "!" em francês.
const NNBSP = " ";

export type StepIcon = "repeat" | "book" | "mic" | "pencil" | "sparkle";

export type LessonStep = {
  readonly id: string;
  readonly label: string;
  readonly minutes: number;
  readonly icon: StepIcon;
};

export type Lesson = {
  readonly title: string;
  readonly chapter: string;
  readonly lessonNumber: number;
  readonly lessonCount: number;
  readonly streakDays: number;
  readonly steps: readonly LessonStep[];
};

export const lessonToday: Lesson = {
  title: "Au café",
  chapter: `Bonjour${NNBSP}!`,
  lessonNumber: 3,
  lessonCount: 8,
  streakDays: 12,
  steps: [
    { id: "review", label: "Revisar 8 cartões", minutes: 3, icon: "repeat" },
    { id: "words", label: "6 palavras novas", minutes: 5, icon: "book" },
    { id: "listen", label: "Escutar e falar", minutes: 4, icon: "mic" },
    { id: "write", label: "Escrever", minutes: 3, icon: "pencil" },
    { id: "chat", label: "Conversar com a IA", minutes: 5, icon: "sparkle" },
  ],
};

export const greeting = `Bonjour${NNBSP}!`;

export function totalMinutes(lesson: Lesson): number {
  return lesson.steps.reduce((sum, step) => sum + step.minutes, 0);
}

export type WeekDayState = "done" | "today" | "upcoming";
export type WeekDay = { readonly letter: string; readonly name: string; readonly state: WeekDayState };

const WEEK = [
  { letter: "S", name: "segunda" },
  { letter: "T", name: "terça" },
  { letter: "Q", name: "quarta" },
  { letter: "Q", name: "quinta" },
  { letter: "S", name: "sexta" },
  { letter: "S", name: "sábado" },
  { letter: "D", name: "domingo" },
] as const;

const EN_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// Índice do dia da semana (segunda = 0) na data local do fuso informado.
function weekdayIndex(now: Date, timeZone: string): number {
  const short = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(now);
  return EN_WEEKDAYS.indexOf(short as (typeof EN_WEEKDAYS)[number]);
}

// Dados de exemplo: os dias antes de hoje contam como feitos.
export function buildWeek(now: Date, timeZone: string): readonly WeekDay[] {
  const today = weekdayIndex(now, timeZone);
  return WEEK.map((day, index) => ({
    ...day,
    state: index < today ? "done" : index === today ? "today" : "upcoming",
  }));
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
