import "server-only";
import { getConfig } from "./config";
import { getDb } from "./db";
import type { StudyContext } from "./study";

/** Banco real, relógio de agora e fuso configurado. */
export function studyContext(): StudyContext {
  return { db: getDb(), now: Math.floor(Date.now() / 1000), timeZone: getConfig().timeZone };
}
