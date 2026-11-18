import type { Db } from "./db";
import { addDays } from "./time";

// Etapas concluídas e dias de estudo. "Dia" é sempre o dia local (AAAA-MM-DD).

export function markStepDone(db: Db, lessonId: string, stepId: string, day: string, now: number): void {
  db.prepare(
    "INSERT OR IGNORE INTO step_completions (lesson_id, step_id, day, completed_at) VALUES (?, ?, ?, ?)",
  ).run(lessonId, stepId, day, now);
}

/** Etapas da aula com pelo menos uma conclusão. */
export function stepsEverDone(db: Db, lessonId: string): Set<string> {
  const rows = db
    .prepare("SELECT DISTINCT step_id FROM step_completions WHERE lesson_id = ?")
    .all(lessonId) as { step_id: string }[];
  return new Set(rows.map((row) => row.step_id));
}

/** Etapas da aula concluídas no dia local `day`. */
export function stepsDoneOn(db: Db, lessonId: string, day: string): Set<string> {
  const rows = db
    .prepare("SELECT step_id FROM step_completions WHERE lesson_id = ? AND day = ?")
    .all(lessonId, day) as { step_id: string }[];
  return new Set(rows.map((row) => row.step_id));
}

/** Marca o dia como estudado (idempotente). Qualquer nota ou etapa concluída conta. */
export function markStudied(db: Db, day: string, now: number): void {
  db.prepare("INSERT OR IGNORE INTO study_days (day, first_at) VALUES (?, ?)").run(day, now);
}

/** Dias estudados entre `from` e `to`, inclusive. */
export function studiedDaysBetween(db: Db, from: string, to: string): Set<string> {
  const rows = db
    .prepare("SELECT day FROM study_days WHERE day >= ? AND day <= ?")
    .all(from, to) as { day: string }[];
  return new Set(rows.map((row) => row.day));
}

/**
 * Dias seguidos de estudo. Se hoje ainda não teve estudo, a sequência de
 * ontem continua valendo: ela só quebra quando passa um dia inteiro em branco.
 */
export function computeStreak(studied: ReadonlySet<string>, today: string): number {
  let cursor = studied.has(today) ? today : addDays(today, -1);
  let days = 0;
  while (studied.has(cursor)) {
    days += 1;
    cursor = addDays(cursor, -1);
  }
  return days;
}

// Janela de consulta da sequência: mais que isso nunca muda o que a tela mostra.
const STREAK_LOOKBACK_DAYS = 1000;

export function currentStreak(db: Db, today: string): number {
  return computeStreak(studiedDaysBetween(db, addDays(today, -STREAK_LOOKBACK_DAYS), today), today);
}
