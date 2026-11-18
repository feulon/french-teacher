import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "../db";
import { DAY } from "./scheduler";
import { countCards, dueQueue, nextDueAt } from "./queue";
import { getCard, listCards, reviewCard } from "./store";

const NOW = 1_800_000_000;
const END_OF_DAY = NOW + 6 * 3600;
const window = { now: NOW, endOfDay: END_OF_DAY };

describe("reviewCard", () => {
  let db: Db;
  beforeEach(() => {
    db = openDatabase(":memory:");
  });

  it("um item sem nota é um cartão novo e não existe no banco", () => {
    expect(getCard(db, "a", NOW).state).toBe("new");
    expect(listCards(db)).toEqual([]);
  });

  it("a primeira nota cria o cartão e registra o histórico", () => {
    const card = reviewCard(db, "a", "good", NOW);
    expect(card).toMatchObject({ state: "learning", step: 1, due: NOW + 600 });
    expect(listCards(db)).toEqual([{ itemId: "a", card }]);
    const log = db.prepare("SELECT item_id, grade, state_before, state_after FROM reviews").all();
    expect(log).toEqual([{ item_id: "a", grade: "good", state_before: "new", state_after: "learning" }]);
  });

  it("notas seguidas evoluem o mesmo cartão até virar revisão", () => {
    reviewCard(db, "a", "good", NOW);
    const card = reviewCard(db, "a", "good", NOW + 600);
    expect(card).toMatchObject({ state: "review", intervalDays: 1, reps: 2, due: NOW + 600 + DAY });
    expect(listCards(db)).toHaveLength(1);
    const first = db.prepare("SELECT introduced_at, last_review_at FROM cards").get();
    expect(first).toEqual({ introduced_at: NOW, last_review_at: NOW + 600 });
  });

  it("lê o estado de volta igual ao que gravou", () => {
    const written = reviewCard(db, "a", "easy", NOW);
    expect(getCard(db, "a", NOW + 5)).toEqual(written);
  });
});

describe("fila e contagens", () => {
  let db: Db;
  beforeEach(() => {
    db = openDatabase(":memory:");
  });

  const ids = ["novo", "aprendendo", "agora", "hoje", "depois"];

  function seed() {
    reviewCard(db, "aprendendo", "good", NOW); // aprendendo, vence em 10 min
    reviewCard(db, "agora", "again", NOW - 120); // aprendendo, já venceu
    reviewCard(db, "hoje", "easy", NOW - 4 * DAY + 3600); // revisão, vence daqui a 1 h
    reviewCard(db, "depois", "easy", NOW); // revisão, vence em 4 dias
  }

  it("a fila traz só o que venceu, do mais atrasado ao mais novo", () => {
    seed();
    expect(dueQueue(listCards(db), window, 10).map((s) => s.itemId)).toEqual(["agora", "hoje"]);
  });

  it("respeita o limite", () => {
    seed();
    expect(dueQueue(listCards(db), window, 1)).toHaveLength(1);
  });

  it("cartão de revisão para amanhã não entra na fila de hoje", () => {
    reviewCard(db, "x", "easy", NOW);
    db.prepare("UPDATE cards SET due = ? WHERE item_id = 'x'").run(END_OF_DAY);
    expect(dueQueue(listCards(db), window, 10)).toEqual([]);
  });

  it("conta novos, aprendendo, para hoje e para depois", () => {
    seed();
    expect(countCards(ids, listCards(db), window)).toEqual({
      new: 1,
      learning: 2,
      dueToday: 1,
      later: 1,
      total: 5,
    });
  });

  it("ignora cartões de itens que saíram do conteúdo", () => {
    reviewCard(db, "fantasma", "good", NOW);
    expect(countCards(["novo"], listCards(db), window)).toMatchObject({ new: 1, learning: 0, total: 1 });
  });

  it("sem nenhum cartão, tudo é novo", () => {
    expect(countCards(ids, [], window)).toEqual({ new: 5, learning: 0, dueToday: 0, later: 0, total: 5 });
  });

  it("nextDueAt acha o próximo vencimento futuro", () => {
    expect(nextDueAt([], window)).toBeNull();
    seed();
    expect(nextDueAt(listCards(db), window)).toBe(NOW + 600);
  });
});
