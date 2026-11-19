import type { CSSProperties } from "react";
import type { Item } from "@/lib/content";
import { Fiche } from "./Fiche";
import cards from "./cards.module.css";
import styles from "./exercise.module.css";

type WordFrontProps = { item: Item; number: number; source: string; onFlip: () => void };

// Quanto maior o texto, menor a letra, para o bilhete nunca estourar.
function cueSize(text: string): number {
  if (text.length <= 8) return 44;
  if (text.length <= 16) return 34;
  return 28;
}

// Frente: a dica em português, no bilhete preso com fita. Tocar na ficha vira o cartão.
export function WordFront({ item, number, source, onFlip }: WordFrontProps) {
  return (
    <Fiche top={[`Fiche n° ${number}`, source]} minHeight={420} onClick={onFlip}>
      <figure className={cards.polaroid}>
        <span className={cards.tape} aria-hidden="true" />
        <div className={cards.photo}>
          <span className={cards.label}>Em português</span>
          <p className={`display ${cards.cue}`} style={{ fontSize: cueSize(item.pt) } as CSSProperties}>
            {item.pt}
          </p>
        </div>
        <figcaption className={`hand ${cards.cap}`} aria-hidden="true">
          ?
        </figcaption>
      </figure>
      <p className={`${styles.hint} ${cards.frontHint}`}>Pense na resposta e toque para virar.</p>
    </Fiche>
  );
}
