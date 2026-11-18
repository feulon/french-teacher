import type { CSSProperties } from "react";
import type { Item } from "@/lib/content";
import { Icon } from "../Icon";
import { Fiche } from "./Fiche";
import cards from "./cards.module.css";
import styles from "./exercise.module.css";
import type { Speech } from "../useSpeech";
import { NORMAL_RATE } from "@/lib/speech";
import { SpeechNotice } from "./SpeechNotice";

type WordBackProps = { item: Item; number: number; source: string; speech: Speech };

const len = (text: string) => ({ "--len": text.length }) as CSSProperties;

// Linhas da pauta que vêm antes dos exemplos: palavra (2) + IPA + pronúncia + tradução.
const RULED_FROM = 58 + 36 * 5;

// Verso: a palavra em francês, como se lê, IPA, tradução e a frase de exemplo.
export function WordBack({ item, number, source, speech }: WordBackProps) {
  const speakable = item.fr.replace("…", "");
  return (
    <Fiche top={[`Fiche n° ${number} · verso`, source]} ruledFrom={RULED_FROM} minHeight={RULED_FROM + 150}>
      <div className={cards.word}>
        <h2 className="display" style={len(item.fr)}>
          {item.fr}
        </h2>
        <button
          type="button"
          className={cards.speak}
          aria-label="Ouvir a palavra"
          disabled={speech.support.kind !== "ready"}
          onClick={() => speech.speak(speakable, NORMAL_RATE)}
        >
          <Icon name="volume" size={26} />
        </button>
      </div>
      <p className={`ipa ${styles.row} ${cards.ipaRow}`}>
        {item.tag ? <span className={cards.tag}>{item.tag}</span> : null}
        {item.ipa}
      </p>
      <p className={`${styles.row} ${cards.pronRow}`}>
        <span className={cards.pronLabel}>lê-se</span>
        <span className={cards.pron}>{item.pron}</span>
      </p>
      <p className={`${styles.row} ${cards.trad}`} style={len(item.pt)}>
        {item.pt}
      </p>
      <p className={`${styles.row} ${cards.exFr}`} style={len(item.example.fr)}>
        {item.example.fr}
      </p>
      <p className={`${styles.row} ${cards.exPt}`}>{item.example.pt}</p>
      {item.note ? <p className={cards.note}>{item.note}</p> : null}
      <SpeechNotice support={speech.support} />
    </Fiche>
  );
}
