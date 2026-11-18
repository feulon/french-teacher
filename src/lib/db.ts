import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getConfig } from "./config";

export type Db = DatabaseSync;

const SCHEMA = `
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
