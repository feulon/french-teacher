import type { SessionCard } from "./study";
import type { CardSnapshot } from "./srs/scheduler";

// Fila de uma sessão de cartões, no navegador. Quem erra volta para o fim da
// fila na mesma sessão (aprendizado de 1 min); o resto sai.

/** Nota que traz o cartão de volta ainda na sessão: vence em até 2 minutos. */
export const REQUEUE_WINDOW_SECONDS = 120;

export type SessionState = {
  readonly queue: readonly SessionCard[];
  /** Itens distintos da sessão. */
  readonly total: number;
  /** Itens já resolvidos (saíram da fila). */
  readonly resolved: number;
};

export function startSession(cards: readonly SessionCard[]): SessionState {
  return { queue: cards, total: cards.length, resolved: 0 };
}

export function currentCard(state: SessionState): SessionCard | undefined {
  return state.queue[0];
}

export function isFinished(state: SessionState): boolean {
  return state.queue.length === 0;
}

/** Aplica o resultado da nota ao cartão da frente da fila. */
export function advance(state: SessionState, graded: CardSnapshot, now: number): SessionState {
  const [head, ...rest] = state.queue;
  if (!head) return state;
  const comesBack = graded.state !== "review" && graded.due - now <= REQUEUE_WINDOW_SECONDS;
  return comesBack
    ? { ...state, queue: [...rest, { ...head, card: graded }] }
    : { ...state, queue: rest, resolved: state.resolved + 1 };
}
