import type { SpeechSupport } from "@/lib/speech";
import styles from "./exercise.module.css";

// Diz com clareza por que não há áudio, em vez de um botão que não faz nada.
export function SpeechNotice({ support }: { support: SpeechSupport }) {
  if (support.kind === "ready") return null;
  return (
    <p className={styles.notice} role="status">
      {support.kind === "unsupported"
        ? "Este navegador não tem voz para ler em voz alta. Tente o Chrome ou o Safari."
        : "Seu aparelho não tem uma voz em francês instalada, então o áudio fica desligado. Instale uma nas configurações de voz do sistema."}
    </p>
  );
}
