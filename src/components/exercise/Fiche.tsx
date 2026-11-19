import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import styles from "./exercise.module.css";

type FicheProps = {
  /** Cantos da faixa de cima: número da ficha e aula de origem. */
  top: readonly [string, string];
  /** Onde a pauta começa (px, a partir do topo). Padrão: logo abaixo da margem vermelha. */
  ruledFrom?: number;
  /** Espaço sem pauta no pé da ficha (px). */
  ruledBottom?: number;
  /** Altura mínima (px): abaixo disso o corpo da tela rola em vez de espremer a ficha. */
  minHeight?: number;
  onClick?: MouseEventHandler<HTMLElement>;
  children: ReactNode;
};

// A ficha de caderno dos exercícios. A pauta é de 36 px e as linhas de texto
// (`row`) têm a mesma altura, então o texto assenta sobre a pauta.
export function Fiche({ top, ruledFrom = 58, ruledBottom = 0, minHeight = 0, onClick, children }: FicheProps) {
  const style = {
    "--lt": `${ruledFrom}px`,
    "--lb": `${ruledBottom}px`,
    "--min-h": `${minHeight}px`,
  } as CSSProperties;
  return (
    <article className={styles.fiche} style={style} onClick={onClick}>
      <div className={styles.top}>
        <span>{top[0]}</span>
        <span>{top[1]}</span>
      </div>
      {children}
    </article>
  );
}
