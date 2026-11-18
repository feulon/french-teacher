import type { StoredCard } from "./store";

// Regras de "o que está pendente" e das contagens. Puras: quem chama passa o
// agora e o fim do dia local.

export type DueWindow = {
  /** Agora, em segundos. */
  readonly now: number;
  /** Primeiro instante do dia seguinte (local), em segundos. */
  readonly endOfDay: number;
};

/**
 * Vence agora: passos de aprendizado cujo horário chegou e cartões de revisão
 * agendados para hoje ou antes. Revisão tem granularidade de dia, então um
 * cartão "para amanhã" só aparece a partir da meia-noite.
 */
export function isDue({ card }: StoredCard, { now, endOfDay }: DueWindow): boolean {
  return card.state === "review" ? card.due < endOfDay : card.due <= now;
}

export function dueQueue(cards: readonly StoredCard[], window: DueWindow, limit: number): StoredCard[] {
  return cards
    .filter((stored) => isDue(stored, window))
    .sort((a, b) => a.card.due - b.card.due || a.itemId.localeCompare(b.itemId))
    .slice(0, limit);
}

export type CardCounts = {
  /** Itens que ainda não receberam nenhuma nota. */
  readonly new: number;
  /** Em passos de aprendizado (primeira vez ou depois de um erro). */
  readonly learning: number;
  /** Em revisão e vencendo hoje ou antes. */
  readonly dueToday: number;
  /** Em revisão, agendados para depois de hoje. */
  readonly later: number;
  readonly total: number;
};

export function countCards(
  itemIds: readonly string[],
  cards: readonly StoredCard[],
  window: DueWindow,
): CardCounts {
  const known = new Set(itemIds);
  const started = cards.filter((stored) => known.has(stored.itemId));
  const learning = started.filter((s) => s.card.state !== "review").length;
  const reviews = started.filter((s) => s.card.state === "review");
  const dueToday = reviews.filter((s) => s.card.due < window.endOfDay).length;
  return {
    new: itemIds.length - started.length,
    learning,
    dueToday,
    later: reviews.length - dueToday,
    total: itemIds.length,
  };
}

/** Próximo vencimento ainda no futuro, ou null se nada está agendado. Em revisão, vale o dia, não a hora. */
export function nextDueAt(cards: readonly StoredCard[], window: DueWindow): number | null {
  let next: number | null = null;
  for (const stored of cards) {
    if (isDue(stored, window)) continue;
    if (next === null || stored.card.due < next) next = stored.card.due;
  }
  return next;
}
