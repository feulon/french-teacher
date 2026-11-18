import { describe, expect, it } from "vitest";
import { lessonForToday } from "@/content";
import { newCard, schedule } from "./srs/scheduler";
import { advance, currentCard, isFinished, startSession } from "./session-queue";
import type { SessionCard } from "./study";

const NOW = 1_800_000_000;
const cards: SessionCard[] = lessonForToday()
  .items.slice(0, 3)
  .map((item, index) => ({ item, number: index + 1, source: "Premiers mots", card: newCard(NOW) }));

describe("fila da sessão", () => {
  it("começa pelo primeiro cartão", () => {
    const state = startSession(cards);
    expect(currentCard(state)?.item.id).toBe(cards[0].item.id);
    expect(state).toMatchObject({ total: 3, resolved: 0 });
  });

  it("nota que adia por mais de 2 minutos tira o cartão da fila", () => {
    const state = startSession(cards);
    const next = advance(state, schedule(cards[0].card, "good", NOW), NOW); // 10 min
    expect(next.queue.map((c) => c.item.id)).toEqual([cards[1].item.id, cards[2].item.id]);
    expect(next.resolved).toBe(1);
  });

  it("De novo manda o cartão para o fim da fila, com o estado novo", () => {
    const state = startSession(cards);
    const again = schedule(cards[0].card, "again", NOW);
    const next = advance(state, again, NOW);
    expect(next.queue.map((c) => c.item.id)).toEqual([cards[1].item.id, cards[2].item.id, cards[0].item.id]);
    expect(next.queue[2].card).toEqual(again);
    expect(next.resolved).toBe(0);
    expect(next.total).toBe(3);
  });

  it("Fácil em cartão novo resolve de vez", () => {
    const next = advance(startSession(cards), schedule(cards[0].card, "easy", NOW), NOW);
    expect(next.resolved).toBe(1);
  });

  it("termina quando a fila esvazia", () => {
    let state = startSession(cards.slice(0, 1));
    expect(isFinished(state)).toBe(false);
    state = advance(state, schedule(cards[0].card, "good", NOW), NOW);
    expect(isFinished(state)).toBe(true);
    expect(currentCard(state)).toBeUndefined();
  });

  it("a fila vazia não quebra", () => {
    const empty = startSession([]);
    expect(advance(empty, schedule(newCard(NOW), "good", NOW), NOW)).toBe(empty);
  });

  it("um cartão que erra sempre continua voltando", () => {
    let state = startSession(cards.slice(0, 1));
    for (let i = 0; i < 4; i += 1) {
      state = advance(state, schedule(currentCard(state)!.card, "again", NOW), NOW);
    }
    expect(state.queue).toHaveLength(1);
    expect(state.resolved).toBe(0);
  });
});
