import { beforeEach, describe, expect, it } from "vitest";
import { lessonForToday } from "@/content";
import { openDatabase, type Db } from "./db";
import { DAY } from "./srs/scheduler";
import {
  cardsOverview,
  finishStep,
  gradeItem,
  newWordsSession,
  reviewSession,
  todayOverview,
  type StudyContext,
} from "./study";

const SP = "America/Sao_Paulo";
const T0 = Math.floor(new Date("2026-11-18T15:00:00Z").getTime() / 1000); // quarta, 12:00 em São Paulo
const items = lessonForToday().items;

describe("fluxo da aula 1", () => {
  let db: Db;
  const at = (now: number): StudyContext => ({ db, now, timeZone: SP });

  beforeEach(() => {
    db = openDatabase(":memory:");
  });

  it("primeira vez: nada para revisar, 12 palavras novas, sem sequência", () => {
    const today = todayOverview(at(T0));
    expect(reviewSession(at(T0))).toEqual({ cards: [], seen: 0, nextDue: null });
    expect(newWordsSession(at(T0))).toHaveLength(12);
    expect(today.lesson.nextHref).toBe("/aula/palavras");
    expect(today.lesson.phase).toBe("fresh");
    expect(today.streakDays).toBe(0);
    expect(cardsOverview(at(T0))).toEqual({
      counts: { new: 12, learning: 0, dueToday: 0, later: 0, total: 12 },
      dueNow: 0,
      nextDue: null,
    });
  });

  it("cada cartão da sessão sabe seu número de ficha e a aula de origem", () => {
    const [first, second] = newWordsSession(at(T0));
    expect([first.number, second.number]).toEqual([1, 2]);
    expect(first.source).toBe("Premiers mots");
  });

  it("dar nota a uma palavra a tira das novas, abre a sequência e marca o dia", () => {
    gradeItem(at(T0), items[0].id, "good");
    expect(newWordsSession(at(T0))).toHaveLength(11);
    const today = todayOverview(at(T0));
    expect(today.studiedToday).toBe(true);
    expect(today.streakDays).toBe(1);
    expect(today.week[2].state).toBe("done");
    expect(today.lesson.phase).toBe("started");
    expect(today.lesson.steps[1].label).toBe("11 palavras novas");
  });

  it("terminar as palavras conclui a etapa; as notas ficam para amanhã", () => {
    for (const item of items) gradeItem(at(T0), item.id, "good");
    finishStep(at(T0), "words");
    const today = todayOverview(at(T0));
    expect(today.lesson.steps.map((s) => `${s.id}:${s.status}`).slice(0, 3)).toEqual([
      "review:empty",
      "words:done",
      "listen:pending",
    ]);
    expect(today.lesson.nextHref).toBe("/aula/escutar");
    // Os 12 estão no 2º passo de aprendizado e voltam em 10 minutos.
    const review = reviewSession(at(T0));
    expect(review.cards).toEqual([]);
    expect(review.seen).toBe(12);
    expect(review.nextDue).toBe(T0 + 600);
    expect(cardsOverview(at(T0)).counts).toMatchObject({ new: 0, learning: 12 });
  });

  it("10 minutos depois os cartões vencem; ao acertar de novo viram revisão de amanhã", () => {
    for (const item of items) gradeItem(at(T0), item.id, "good");
    const later = T0 + 601;
    expect(reviewSession(at(later)).cards).toHaveLength(12);
    expect(todayOverview(at(later)).lesson.steps[0]).toMatchObject({ label: "Revisar 12 cartões", status: "pending" });
    for (const { item } of reviewSession(at(later)).cards) gradeItem(at(later), item.id, "good");
    finishStep(at(later), "review");
    expect(reviewSession(at(later)).cards).toEqual([]);
    expect(cardsOverview(at(later)).counts).toMatchObject({ learning: 0, dueToday: 0, later: 12 });

    // No dia seguinte (quinta, 12:00) eles vencem; a sequência chega a 2.
    const tomorrow = T0 + DAY + 601;
    expect(reviewSession(at(tomorrow)).cards).toHaveLength(12);
    gradeItem(at(tomorrow), items[0].id, "easy");
    expect(todayOverview(at(tomorrow)).streakDays).toBe(2);
  });

  it("Revisar e Escutar valem por dia; Palavras novas valem uma vez", () => {
    finishStep(at(T0), "listen");
    expect(todayOverview(at(T0)).lesson.steps.find((s) => s.id === "listen")?.status).toBe("done");
    expect(todayOverview(at(T0 + DAY)).lesson.steps.find((s) => s.id === "listen")?.status).toBe("pending");
  });

  it("a sequência quebra depois de um dia inteiro sem estudo", () => {
    gradeItem(at(T0), items[0].id, "good");
    expect(todayOverview(at(T0 + DAY)).streakDays).toBe(1); // ainda dá para manter
    expect(todayOverview(at(T0 + 2 * DAY)).streakDays).toBe(0);
  });

  it("rejeita item desconhecido e etapa que ainda não existe", () => {
    expect(() => gradeItem(at(T0), "nao-existe", "good")).toThrow(/desconhecido/);
    expect(() => finishStep(at(T0), "chat")).toThrow(/não existe/);
    expect(() => finishStep(at(T0), "write")).toThrow();
  });

  it("um erro não deixa meia gravação: item inválido não marca o dia", () => {
    expect(() => gradeItem(at(T0), "nao-existe", "good")).toThrow();
    expect(todayOverview(at(T0)).studiedToday).toBe(false);
  });
});
