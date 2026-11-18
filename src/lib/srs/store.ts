import type { Db } from "../db";
import {
  newCard,
  schedule,
  type CardSnapshot,
  type CardState,
  type Grade,
} from "./scheduler";

export type StoredCard = { readonly itemId: string; readonly card: CardSnapshot };

type CardRow = {
  item_id: string;
  state: Exclude<CardState, "new">;
  step: number;
  interval_days: number;
  ease: number;
  reps: number;
  lapses: number;
  due: number;
};

const toStored = (row: CardRow): StoredCard => ({
  itemId: row.item_id,
  card: {
    state: row.state,
    step: row.step,
    intervalDays: row.interval_days,
    ease: row.ease,
    reps: row.reps,
    lapses: row.lapses,
    due: row.due,
  },
});

export function listCards(db: Db): StoredCard[] {
  const rows = db
    .prepare("SELECT item_id, state, step, interval_days, ease, reps, lapses, due FROM cards ORDER BY due, item_id")
    .all() as CardRow[];
  return rows.map(toStored);
}

/** Cartão guardado, ou um cartão novo se o item ainda não foi visto. */
export function getCard(db: Db, itemId: string, now: number): CardSnapshot {
  const row = db
    .prepare("SELECT item_id, state, step, interval_days, ease, reps, lapses, due FROM cards WHERE item_id = ?")
    .get(itemId) as CardRow | undefined;
  return row ? toStored(row).card : newCard(now);
}

/**
 * Aplica uma nota: calcula o próximo estado, grava o cartão e o histórico na
 * mesma transação. `now` é em segundos.
 */
export function reviewCard(db: Db, itemId: string, grade: Grade, now: number): CardSnapshot {
  db.exec("BEGIN IMMEDIATE");
  try {
    const before = getCard(db, itemId, now);
    const after = schedule(before, grade, now);
    if (after.state === "new") throw new Error("Um cartão avaliado nunca continua novo.");
    db.prepare(
      `INSERT INTO cards (item_id, state, step, interval_days, ease, reps, lapses, due, introduced_at, last_review_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(item_id) DO UPDATE SET
         state = excluded.state, step = excluded.step, interval_days = excluded.interval_days,
         ease = excluded.ease, reps = excluded.reps, lapses = excluded.lapses, due = excluded.due,
         last_review_at = excluded.last_review_at`,
    ).run(itemId, after.state, after.step, after.intervalDays, after.ease, after.reps, after.lapses, after.due, now, now);
    db.prepare(
      `INSERT INTO reviews (item_id, grade, reviewed_at, state_before, state_after, interval_days_after, due_after)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(itemId, grade, now, before.state, after.state, after.intervalDays, after.due);
    db.exec("COMMIT");
    return after;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
