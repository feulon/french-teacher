"use client";

import { useState, type CSSProperties } from "react";
import { finishStepAction } from "@/app/(exercise)/aula/actions";
import { NORMAL_RATE, SLOW_RATE, formatRate } from "@/lib/speech";
import { Icon } from "../Icon";
import { useSpeech } from "../useSpeech";
import { ExerciseBar } from "./ExerciseBar";
import { Fiche } from "./Fiche";
import { SpeechNotice } from "./SpeechNotice";
import { StepDone } from "./StepDone";
import listen from "./listen.module.css";
import styles from "./exercise.module.css";

export type ListenPhrase = {
  readonly id: string;
  readonly fr: string;
  readonly ipa: string;
  readonly pt: string;
  readonly highlight: string;
};

type ListenFlowProps = { phrases: readonly ListenPhrase[]; source: string };

// Altura das barras do player: decoração, igual ao mockup.
const WAVE = [7, 11, 16, 27, 13, 12, 7, 12, 31, 32, 14, 11, 15, 14, 30, 21, 10, 16, 14, 18, 23, 7, 8];

// Segundos estimados para a frase: só serve para animar as barras.
const SECONDS_PER_CHAR = 0.075;

function Sentence({ phrase }: { phrase: ListenPhrase }) {
  const at = phrase.fr.indexOf(phrase.highlight);
  if (at < 0) return <>{phrase.fr}</>;
  return (
    <>
      {phrase.fr.slice(0, at)}
      <mark>{phrase.highlight}</mark>
      {phrase.fr.slice(at + phrase.highlight.length)}
    </>
  );
}

export function ListenFlow({ phrases, source }: ListenFlowProps) {
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState(SLOW_RATE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const speech = useSpeech();

  const phrase = phrases[index];
  const last = index === phrases.length - 1;
  const total = phrases.length;

  if (done) {
    return (
      <StepDone
        source={source}
        total={total}
        summary={total === 1 ? "Você ouviu 1 frase." : `Você ouviu ${total} frases.`}
        detail="Repita em voz alta sempre que puder: ouvir e falar junto fixa muito mais que só ler."
      />
    );
  }

  async function next() {
    if (busy) return;
    speech.stop();
    if (!last) {
      setIndex(index + 1);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await finishStepAction("listen");
      if (result.ok) setDone(true);
      else setError(result.error);
    } catch {
      setError("Sem conexão com o servidor. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  const toggleRate = () => {
    const nextRate = rate === SLOW_RATE ? NORMAL_RATE : SLOW_RATE;
    setRate(nextRate);
    speech.speak(phrase.fr, nextRate);
  };

  const duration = (phrase.fr.length * SECONDS_PER_CHAR) / rate;
  const waveStyle = { "--dur": `${duration.toFixed(2)}s` } as CSSProperties;

  return (
    <>
      <ExerciseBar resolved={index} total={total} label={`Frase ${index + 1} de ${total}`} />
      <section className={styles.task}>
        <div>
          <p className="eyebrow">Escutar e falar</p>
          <h1 className={`display ${styles.title}`}>Escute e repita.</h1>
        </div>
        <Fiche top={[`Frase ${index + 1}`, source]} ruledBottom={112} minHeight={372}>
          <div className={listen.phrase}>
            <div className={styles.row} aria-hidden="true" />
            <p className={`display ${listen.sentence}`} lang="fr">
              <Sentence phrase={phrase} />
            </p>
          </div>
          <p className={`ipa ${listen.ipaLine}`}>{phrase.ipa}</p>
          <p className={listen.ptLine}>{phrase.pt}</p>
          <SpeechNotice support={speech.support} />
          <div className={`${styles.bottom} ${listen.player}`}>
            <button
              type="button"
              className={listen.play}
              aria-label="Ouvir de novo"
              disabled={speech.support.kind !== "ready"}
              onClick={() => speech.speak(phrase.fr, rate)}
            >
              <Icon name="play" size={24} />
            </button>
            <div
              key={speech.speaking ? "on" : "off"}
              className={`${listen.wave} ${speech.speaking ? listen.speaking : ""}`}
              style={waveStyle}
              aria-hidden="true"
            >
              {WAVE.map((height, bar) => (
                <i key={bar} style={{ "--h": `${height}px`, "--i": bar } as CSSProperties} />
              ))}
            </div>
            <button
              type="button"
              className={listen.speed}
              aria-label={`Velocidade ${formatRate(rate)}. Toque para trocar.`}
              onClick={toggleRate}
              disabled={speech.support.kind !== "ready"}
            >
              {formatRate(rate)}
            </button>
          </div>
        </Fiche>
      </section>
      <section className={listen.soon} aria-label="Gravação de fala, em breve">
        <span className={listen.micOff} aria-hidden="true">
          <Icon name="mic" size={22} />
        </span>
        <p>
          <b>Gravar sua voz: em breve</b>
          Por enquanto, repita a frase em voz alta e compare com o áudio.
        </p>
      </section>
      <div className={styles.dock}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className="btn btn-primary" disabled={busy} onClick={next}>
          {last ? "Concluir" : "Próxima frase"} <Icon name="arrow" />
        </button>
      </div>
    </>
  );
}
