import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getConfig } from "./config";

export type Db = DatabaseSync;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS login_failures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS login_failures_ip_at ON login_failures (ip, at);
  CREATE INDEX IF NOT EXISTS login_failures_at ON login_failures (at);

  -- Progresso de estudo. O app tem um único estudante, então nada aqui leva usuário.
  -- Um cartão só existe depois da primeira nota; item sem linha é "novo".
  CREATE TABLE IF NOT EXISTS cards (
    item_id TEXT PRIMARY KEY,
    state TEXT NOT NULL CHECK (state IN ('learning', 'review', 'relearning')),
    step INTEGER NOT NULL,
    interval_days INTEGER NOT NULL,
    ease REAL NOT NULL,
    reps INTEGER NOT NULL,
    lapses INTEGER NOT NULL,
    due INTEGER NOT NULL,
    introduced_at INTEGER NOT NULL,
    last_review_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS cards_due ON cards (due);
  -- Histórico de notas: base para trocar o algoritmo depois sem perder dados.
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT NOT NULL,
    grade TEXT NOT NULL,
    reviewed_at INTEGER NOT NULL,
    state_before TEXT NOT NULL,
    state_after TEXT NOT NULL,
    interval_days_after INTEGER NOT NULL,
    due_after INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS reviews_item ON reviews (item_id, reviewed_at);
  -- Etapas concluídas, por dia local (AAAA-MM-DD).
  CREATE TABLE IF NOT EXISTS step_completions (
    lesson_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    day TEXT NOT NULL,
    completed_at INTEGER NOT NULL,
    PRIMARY KEY (lesson_id, step_id, day)
  );
  -- Dias em que houve estudo de verdade: base da sequência (streak).
  CREATE TABLE IF NOT EXISTS study_days (
    day TEXT PRIMARY KEY,
    first_at INTEGER NOT NULL
  );
`;

export function openDatabase(path: string): Db {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec(SCHEMA);
  return db;
}

const globalForDb = globalThis as typeof globalThis & { __frenchTeacherDb?: Db };

// Uma conexão por processo, aberta só no primeiro uso (nunca durante o build).
export function getDb(): Db {
  if (!globalForDb.__frenchTeacherDb) {
    const { dataDir } = getConfig();
    mkdirSync(dataDir, { recursive: true });
    globalForDb.__frenchTeacherDb = openDatabase(join(dataDir, "app.db"));
  }
  return globalForDb.__frenchTeacherDb;
}
