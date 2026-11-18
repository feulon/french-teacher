import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "./db";
import {
  computeStreak,
  currentStreak,
  markStepDone,
  markStudied,
  stepsDoneOn,
  stepsEverDone,
  studiedDaysBetween,
} from "./progress";

describe("computeStreak", () => {
  const days = (...list: string[]) => new Set(list);

  it("sem estudo, zero", () => {
    expect(computeStreak(days(), "2026-11-18")).toBe(0);
  });

  it("conta os dias seguidos até hoje", () => {
    expect(computeStreak(days("2026-11-16", "2026-11-17", "2026-11-18"), "2026-11-18")).toBe(3);
  });

  it("hoje ainda sem estudo: a sequência de ontem continua", () => {
    expect(computeStreak(days("2026-11-16", "2026-11-17"), "2026-11-18")).toBe(2);
  });

  it("um dia inteiro em branco zera a sequência", () => {
    expect(computeStreak(days("2026-11-15", "2026-11-16"), "2026-11-18")).toBe(0);
  });

  it("um buraco no meio corta a contagem", () => {
    expect(computeStreak(days("2026-11-14", "2026-11-16", "2026-11-17", "2026-11-18"), "2026-11-18")).toBe(3);
  });

  it("atravessa a virada de mês", () => {
    expect(computeStreak(days("2026-10-31", "2026-11-01", "2026-11-02"), "2026-11-02")).toBe(3);
  });
});

describe("progresso no banco", () => {
  let db: Db;
  beforeEach(() => {
    db = openDatabase(":memory:");
  });

  it("guarda etapas por dia e não duplica", () => {
    markStepDone(db, "c1-l1", "listen", "2026-11-18", 100);
    markStepDone(db, "c1-l1", "listen", "2026-11-18", 200);
    markStepDone(db, "c1-l1", "words", "2026-11-17", 50);
    expect(stepsDoneOn(db, "c1-l1", "2026-11-18")).toEqual(new Set(["listen"]));
    expect(stepsEverDone(db, "c1-l1")).toEqual(new Set(["listen", "words"]));
    const n = db.prepare("SELECT COUNT(*) AS n FROM step_completions").get() as { n: number };
    expect(n.n).toBe(2);
  });

  it("separa aulas diferentes", () => {
    markStepDone(db, "c1-l1", "words", "2026-11-18", 100);
    expect(stepsEverDone(db, "c1-l2").size).toBe(0);
  });

  it("marca dias estudados uma vez só e calcula a sequência", () => {
    markStudied(db, "2026-11-17", 1);
    markStudied(db, "2026-11-18", 2);
    markStudied(db, "2026-11-18", 3);
    expect(studiedDaysBetween(db, "2026-11-01", "2026-11-30")).toEqual(new Set(["2026-11-17", "2026-11-18"]));
    expect(currentStreak(db, "2026-11-18")).toBe(2);
    expect(currentStreak(db, "2026-11-19")).toBe(2);
    expect(currentStreak(db, "2026-11-20")).toBe(0);
  });
});
