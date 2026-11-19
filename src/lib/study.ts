import { allItems, findItem, lessonForToday, lessons } from "@/content";
import type { Item, StepId } from "./content";
import type { Db } from "./db";
import { buildTodayLesson, buildWeek, weekRange, type TodayLesson, type WeekDay } from "./lesson";
import {
  currentStreak,
  markStepDone,
  markStudied,
  stepsDoneOn,
  studiedDaysBetween,
} from "./progress";
import { countCards, dueQueue, nextDueAt, type CardCounts, type DueWindow } from "./srs/queue";
import type { CardSnapshot, Grade } from "./srs/scheduler";
import { newCard } from "./srs/scheduler";
import { listCards, reviewCard, type StoredCard } from "./srs/store";
import { dayKey, startOfNextDay } from "./time";

// Casos de uso do estudo. Recebem o banco, o instante e o fuso por parâmetro:
// páginas e ações só ligam isto ao banco real e ao relógio.

export type StudyContext = {
  readonly db: Db;
  /** Agora, em segundos desde 1970. */
  readonly now: number;
  readonly timeZone: string;
};

export const REVIEW_SESSION_LIMIT = 30;

/** Etapas que o aluno pode concluir hoje; Escrever e Conversar ainda não existem. */
export const PLAYABLE_STEPS: readonly StepId[] = ["review", "words", "listen"];

export type SessionCard = {
  readonly item: Item;
  /** Posição do item no conteúdo (1, 2, 3...): vira o "Fiche n°" do cartão. */
  readonly number: number;
  /** Título da aula de origem, no canto da ficha. */
  readonly source: string;
  readonly card: CardSnapshot;
};

function toSessionCard(item: Item, card: CardSnapshot): SessionCard {
  const index = allItems().findIndex((candidate) => candidate.id === item.id);
  const lesson = lessons.find((candidate) => candidate.items.some((own) => own.id === item.id));
  return { item, number: index + 1, source: lesson?.title ?? "", card };
}

const today = (ctx: StudyContext) => dayKey(ctx.now, ctx.timeZone);

function windowOf(ctx: StudyContext): DueWindow {
  return { now: ctx.now, endOfDay: startOfNextDay(ctx.now, ctx.timeZone) };
}

function itemIds(): string[] {
  return allItems().map((item) => item.id);
}

export type TodayOverview = {
  readonly lesson: TodayLesson;
  readonly streakDays: number;
  readonly studiedToday: boolean;
  readonly week: readonly WeekDay[];
};

export function todayOverview(ctx: StudyContext): TodayOverview {
  const lesson = lessonForToday();
  const stored = listCards(ctx.db);
  const known = new Set(lesson.items.map((item) => item.id));
  const started = stored.filter((s) => known.has(s.itemId));
  const dueNow = dueQueue(started, windowOf(ctx), REVIEW_SESSION_LIMIT).length;

  const day = today(ctx);
  const nowDate = new Date(ctx.now * 1000);
  const range = weekRange(nowDate, ctx.timeZone);
  const studied = studiedDaysBetween(ctx.db, range.from, range.to);

  return {
    lesson: buildTodayLesson({
      lesson,
      dueCount: dueNow,
      newRemaining: lesson.items.length - started.length,
      doneToday: stepsDoneOn(ctx.db, lesson.id, day),
      studiedToday: studied.has(day),
    }),
    streakDays: currentStreak(ctx.db, day),
    studiedToday: studied.has(day),
    week: buildWeek(nowDate, ctx.timeZone, studied),
  };
}

/** Palavras da aula que ainda não receberam nota, na ordem da aula. */
export function newWordsSession(ctx: StudyContext): SessionCard[] {
  const seen = new Set(listCards(ctx.db).map((s) => s.itemId));
  return lessonForToday()
    .items.filter((item) => !seen.has(item.id))
    .map((item) => toSessionCard(item, newCard(ctx.now)));
}

export type ReviewSession = {
  readonly cards: readonly SessionCard[];
  /** Quantos cartões já foram vistos alguma vez (para o estado vazio). */
  readonly seen: number;
  /** Próximo vencimento, em segundos, ou null se nada está agendado. */
  readonly nextDue: number | null;
};

export function reviewSession(ctx: StudyContext): ReviewSession {
  const window = windowOf(ctx);
  const known = new Set(itemIds());
  const started = listCards(ctx.db).filter((s) => known.has(s.itemId));
  const cards = dueQueue(started, window, REVIEW_SESSION_LIMIT).flatMap((stored: StoredCard) => {
    const item = findItem(stored.itemId);
    return item ? [toSessionCard(item, stored.card)] : [];
  });
  return { cards, seen: started.length, nextDue: nextDueAt(started, window) };
}

export type CardsOverview = {
  readonly counts: CardCounts;
  /** Cartões vencidos agora, prontos para a etapa Revisar. */
  readonly dueNow: number;
  readonly nextDue: number | null;
};

export function cardsOverview(ctx: StudyContext): CardsOverview {
  const window = windowOf(ctx);
  const known = new Set(itemIds());
  const stored = listCards(ctx.db);
  const started = stored.filter((s) => known.has(s.itemId));
  return {
    counts: countCards(itemIds(), stored, window),
    dueNow: dueQueue(started, window, REVIEW_SESSION_LIMIT).length,
    nextDue: nextDueAt(started, window),
  };
}

/** Registra a nota de um item e conta o dia como estudado. */
export function gradeItem(ctx: StudyContext, itemId: string, grade: Grade): CardSnapshot {
  if (!findItem(itemId)) throw new Error(`Item desconhecido: ${itemId}`);
  const card = reviewCard(ctx.db, itemId, grade, ctx.now);
  markStudied(ctx.db, today(ctx), ctx.now);
  return card;
}

/** Marca uma etapa da aula de hoje como concluída e conta o dia como estudado. */
export function finishStep(ctx: StudyContext, stepId: StepId): void {
  if (!PLAYABLE_STEPS.includes(stepId)) throw new Error(`Etapa que ainda não existe: ${stepId}`);
  markStepDone(ctx.db, lessonForToday().id, stepId, today(ctx), ctx.now);
  markStudied(ctx.db, today(ctx), ctx.now);
}
