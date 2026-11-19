"use client";

import { useState } from "react";
import type { StepId } from "@/lib/content";
import { advance, currentCard, isFinished, startSession } from "@/lib/session-queue";
import { previewDelays, type Grade } from "@/lib/srs/scheduler";
import type { SessionCard } from "@/lib/study";
import { finishStepAction, gradeCardAction } from "@/app/(exercise)/aula/actions";
import { Icon } from "../Icon";
import { useSpeech } from "../useSpeech";
import { ExerciseBar } from "./ExerciseBar";
import { GradeButtons } from "./GradeButtons";
import { StepDone } from "./StepDone";
import { WordBack } from "./WordBack";
import { WordFront } from "./WordFront";
import styles from "./exercise.module.css";

type CardFlowProps = {
  stepId: Extract<StepId, "words" | "review">;
  cards: readonly SessionCard[];
};

const COPY = {
  words: {
    eyebrow: "Palavras novas",
    noun: "Palavra",
    summary: (n: number) => (n === 1 ? "Você viu 1 palavra nova." : `Você viu ${n} palavras novas.`),
    detail: "Elas já estão nos seus Cartões e voltam para revisar na hora certa.",
  },
  review: {
    eyebrow: "Revisar cartões",
    noun: "Cartão",
    summary: (n: number) => (n === 1 ? "Você revisou 1 cartão." : `Você revisou ${n} cartões.`),
    detail: "Cada nota define quando o cartão volta. Quanto melhor você lembra, mais tarde ele reaparece.",
  },
} as const;

const NETWORK_ERROR = "Sem conexão com o servidor. Tente de novo.";

// Frente → verso → nota. Quem erra volta ao fim da fila na mesma sessão.
export function CardFlow({ stepId, cards }: CardFlowProps) {
  const copy = COPY[stepId];
  const [session, setSession] = useState(() => startSession(cards));
  const [shownAt, setShownAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const speech = useSpeech();

  const current = currentCard(session);
  const flipped = shownAt !== null;

  async function finish() {
    const result = await finishStepAction(stepId);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  async function grade(value: Grade) {
    if (busy || !current) return;
    setBusy(true);
    setError(null);
    try {
      const result = await gradeCardAction(current.item.id, value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = advance(session, result.card, result.now);
      speech.stop();
      setSession(next);
      setShownAt(null);
      if (isFinished(next)) await finish();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  async function retryFinish() {
    setBusy(true);
    setError(null);
    try {
      await finish();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <StepDone
        source={cards[0]?.source ?? ""}
        total={session.total}
        summary={copy.summary(session.total)}
        detail={copy.detail}
      />
    );
  }

  const label = `${copy.noun} ${Math.min(session.resolved + 1, session.total)} de ${session.total}`;

  // Todas as notas foram gravadas mas concluir a etapa falhou: só falta tentar de novo.
  if (!current) {
    return (
      <>
        <ExerciseBar resolved={session.total} total={session.total} label={label} />
        <section className={styles.task}>
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 className={`display ${styles.title}`}>Quase lá.</h1>
          </div>
          <p className="muted">Suas notas já estão salvas. Falta só marcar a etapa como concluída.</p>
        </section>
        <div className={styles.dock}>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <button type="button" className="btn btn-primary" disabled={busy} onClick={retryFinish}>
            Tentar de novo
          </button>
        </div>
      </>
    );
  }

  const delays = flipped ? previewDelays(current.card, shownAt) : null;

  return (
    <>
      <ExerciseBar resolved={session.resolved} total={session.total} label={label} />
      <section className={styles.task}>
        {flipped ? null : (
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 className={`display ${styles.title}`}>
              Como se diz
              <br />
              em francês?
            </h1>
          </div>
        )}
        {flipped ? (
          <WordBack item={current.item} number={current.number} source={current.source} speech={speech} />
        ) : (
          <WordFront
            item={current.item}
            number={current.number}
            source={current.source}
            onFlip={() => setShownAt(Math.floor(Date.now() / 1000))}
          />
        )}
      </section>
      <div className={styles.dock}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {delays ? (
          <GradeButtons delays={delays} disabled={busy} onGrade={grade} />
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShownAt(Math.floor(Date.now() / 1000))}
          >
            <Icon name="flip" /> Mostrar resposta
          </button>
        )}
      </div>
    </>
  );
}
