"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { SPEECH_LANG, pickFrenchVoice, speechSupport, type SpeechSupport } from "@/lib/speech";

export type Speech = {
  readonly support: SpeechSupport;
  readonly speaking: boolean;
  /** Fala o texto em francês na velocidade `rate` (1 = normal). */
  readonly speak: (text: string, rate: number) => void;
  readonly stop: () => void;
};

const hasApi = () => typeof window !== "undefined" && "speechSynthesis" in window;

// Chrome e Android só preenchem a lista de vozes depois do carregamento; daí o evento.
function subscribeToVoices(onChange: () => void): () => void {
  if (!hasApi()) return () => {};
  const synth = window.speechSynthesis;
  synth.addEventListener("voiceschanged", onChange);
  return () => synth.removeEventListener("voiceschanged", onChange);
}

function currentSupport(): SpeechSupport["kind"] {
  return speechSupport(hasApi(), hasApi() ? window.speechSynthesis.getVoices() : []).kind;
}

// Voz do navegador (Web Speech API). Nada de áudio gravado: quem fala é o aparelho.
export function useSpeech(): Speech {
  const kind = useSyncExternalStore(subscribeToVoices, currentSupport, () => "ready" as const);
  const [speaking, setSpeaking] = useState(false);

  // Sair da tela corta a fala que ainda estiver tocando.
  useEffect(() => () => {
    if (hasApi()) window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback(
    (text: string, rate: number) => {
      if (kind !== "ready" || !hasApi()) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = SPEECH_LANG;
      utterance.rate = rate;
      const voice = pickFrenchVoice(synth.getVoices());
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      synth.speak(utterance);
    },
    [kind],
  );

  const stop = useCallback(() => {
    if (hasApi()) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { support: { kind }, speaking, speak, stop };
}
