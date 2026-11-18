import { describe, expect, it } from "vitest";
import { formatDelay } from "./format";
import {
  DAY,
  EASY_INTERVAL_DAYS,
  MAX_INTERVAL_DAYS,
  MIN_EASE,
  START_EASE,
  isGrade,
  newCard,
  previewDelays,
  schedule,
  type CardSnapshot,
} from "./scheduler";

const NOW = 1_800_000_000;
const MIN = 60;

const review = (overrides: Partial<CardSnapshot> = {}): CardSnapshot => ({
  state: "review",
  step: 0,
  intervalDays: 10,
  ease: START_EASE,
  reps: 4,
  lapses: 0,
  due: NOW,
  ...overrides,
});

describe("cartão novo", () => {
  it("De novo: aprende, volta em 1 min", () => {
    const next = schedule(newCard(NOW), "again", NOW);
    expect(next).toMatchObject({ state: "learning", step: 0, reps: 1, due: NOW + MIN });
  });

  it("Difícil: espera a média dos dois passos (6 min)", () => {
    const next = schedule(newCard(NOW), "hard", NOW);
    expect(next).toMatchObject({ state: "learning", step: 0, due: NOW + 6 * MIN });
  });

  it("Bom: vai para o 2º passo, 10 min", () => {
    const next = schedule(newCard(NOW), "good", NOW);
    expect(next).toMatchObject({ state: "learning", step: 1, due: NOW + 10 * MIN });
  });

  it("Fácil: forma o cartão direto, 4 dias", () => {
    const next = schedule(newCard(NOW), "easy", NOW);
    expect(next).toMatchObject({ state: "review", intervalDays: EASY_INTERVAL_DAYS, due: NOW + 4 * DAY });
  });

  it("não altera o cartão recebido", () => {
    const card = newCard(NOW);
    const copy = { ...card };
    schedule(card, "good", NOW);
    expect(card).toEqual(copy);
  });
});

describe("aprendendo", () => {
  const second = schedule(newCard(NOW), "good", NOW);

  it("Bom no último passo gradua com 1 dia", () => {
    const next = schedule(second, "good", NOW + 600);
    expect(next).toMatchObject({ state: "review", intervalDays: 1, due: NOW + 600 + DAY, reps: 2 });
  });

  it("Difícil no 2º passo repete os 10 min", () => {
    expect(schedule(second, "hard", NOW).due).toBe(NOW + 10 * MIN);
  });

  it("De novo volta ao 1º passo", () => {
    expect(schedule(second, "again", NOW)).toMatchObject({ state: "learning", step: 0, due: NOW + MIN });
  });

  it("Fácil gradua com 4 dias", () => {
    expect(schedule(second, "easy", NOW)).toMatchObject({ state: "review", intervalDays: 4 });
  });
});

describe("em revisão", () => {
  it("Bom multiplica o intervalo pela facilidade", () => {
    const next = schedule(review(), "good", NOW);
    expect(next).toMatchObject({ state: "review", intervalDays: 25, due: NOW + 25 * DAY, ease: START_EASE });
  });

  it("Difícil cresce devagar (x1,2) e reduz a facilidade", () => {
    const next = schedule(review(), "hard", NOW);
    expect(next.intervalDays).toBe(12);
    expect(next.ease).toBe(2.35);
  });

  it("Fácil cresce mais (x facilidade x1,3) e aumenta a facilidade", () => {
    const next = schedule(review(), "easy", NOW);
    expect(next.intervalDays).toBe(33);
    expect(next.ease).toBe(2.65);
  });

  it("De novo conta um lapso, reduz a facilidade e volta ao aprendizado em 10 min", () => {
    const next = schedule(review(), "again", NOW);
    expect(next).toMatchObject({
      state: "relearning",
      step: 0,
      lapses: 1,
      ease: 2.3,
      intervalDays: 5,
      due: NOW + 10 * MIN,
    });
  });

  it("depois do lapso, Bom volta para revisão com o intervalo reduzido", () => {
    const lapsed = schedule(review(), "again", NOW);
    const back = schedule(lapsed, "good", NOW + 600);
    expect(back).toMatchObject({ state: "review", intervalDays: 5, lapses: 1, due: NOW + 600 + 5 * DAY });
  });

  it("depois do lapso, Fácil dá pelo menos 1 dia a mais", () => {
    const lapsed = schedule(review({ intervalDays: 1 }), "again", NOW);
    expect(schedule(lapsed, "easy", NOW).intervalDays).toBe(2);
  });

  it("a facilidade nunca passa do mínimo", () => {
    let card = review({ ease: 1.4 });
    for (let i = 0; i < 5; i += 1) card = schedule({ ...card, state: "review" }, "hard", NOW);
    expect(card.ease).toBe(MIN_EASE);
  });

  it("o intervalo nunca passa do máximo", () => {
    const next = schedule(review({ intervalDays: 300, ease: 3 }), "easy", NOW);
    expect(next.intervalDays).toBe(MAX_INTERVAL_DAYS);
  });

  it("intervalos pequenos ainda crescem a cada nota: difícil < bom < fácil", () => {
    const next = (grade: "hard" | "good" | "easy") => schedule(review({ intervalDays: 1 }), grade, NOW).intervalDays;
    expect(next("hard")).toBe(2);
    expect(next("good")).toBe(3);
    expect(next("easy")).toBe(4);
  });
});

describe("previewDelays", () => {
  it("mostra o intervalo de cada botão para um cartão novo", () => {
    expect(previewDelays(newCard(NOW), NOW)).toEqual({
      again: 1 * MIN,
      hard: 6 * MIN,
      good: 10 * MIN,
      easy: 4 * DAY,
    });
  });

  it("para um cartão em revisão, os intervalos só crescem", () => {
    const delays = previewDelays(review(), NOW);
    expect(delays.again).toBeLessThan(delays.hard);
    expect(delays.hard).toBeLessThan(delays.good);
    expect(delays.good).toBeLessThan(delays.easy);
  });

  it("bate com o que schedule agenda de fato", () => {
    const card = review();
    const delays = previewDelays(card, NOW);
    for (const grade of ["again", "hard", "good", "easy"] as const) {
      expect(schedule(card, grade, NOW).due - NOW).toBe(delays[grade]);
    }
  });
});

describe("formatDelay", () => {
  it.each([
    [30, "1 min"],
    [60, "1 min"],
    [6 * 60, "6 min"],
    [2 * 3600, "2 h"],
    [DAY, "1 dia"],
    [4 * DAY, "4 dias"],
    [45 * DAY, "2 meses"],
    [40 * DAY, "1 mês"],
    [365 * DAY, "1 ano"],
  ])("%i s vira %s", (seconds, text) => {
    expect(formatDelay(seconds)).toBe(text);
  });
});

describe("isGrade", () => {
  it("aceita só as 4 notas", () => {
    expect(isGrade("good")).toBe(true);
    expect(isGrade("GOOD")).toBe(false);
    expect(isGrade(3)).toBe(false);
    expect(isGrade(undefined)).toBe(false);
  });
});
