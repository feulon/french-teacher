// Voz do navegador (Web Speech API) para ouvir o francês. Funções puras, para testar.

export const SPEECH_LANG = "fr-FR";
export const SLOW_RATE = 0.75;
export const NORMAL_RATE = 1;

export type VoiceLike = { readonly lang: string; readonly name: string; readonly localService?: boolean };

const normalizeLang = (lang: string) => lang.replace("_", "-").toLowerCase();

/** Melhor voz em francês: fr-FR primeiro, depois qualquer fr-*; vozes locais vencem as de rede. */
export function pickFrenchVoice<T extends VoiceLike>(voices: readonly T[]): T | undefined {
  const french = voices.filter((voice) => normalizeLang(voice.lang).startsWith("fr"));
  const rank = (voice: T) =>
    (normalizeLang(voice.lang) === "fr-fr" ? 0 : 2) + (voice.localService === false ? 1 : 0);
  return [...french].sort((a, b) => rank(a) - rank(b))[0];
}

export type SpeechSupport =
  | { readonly kind: "ready" }
  | { readonly kind: "unsupported" }
  | { readonly kind: "no-french-voice" };

/**
 * Sem voz em francês instalada, o navegador leria a frase com sotaque de
 * português: pior que nada para quem está aprendendo. Uma lista de vozes vazia
 * é "ainda não sei" (alguns navegadores só preenchem depois), e aí vale tentar.
 */
export function speechSupport(hasApi: boolean, voices: readonly VoiceLike[]): SpeechSupport {
  if (!hasApi) return { kind: "unsupported" };
  if (voices.length > 0 && pickFrenchVoice(voices) === undefined) return { kind: "no-french-voice" };
  return { kind: "ready" };
}

export function formatRate(rate: number): string {
  return `${String(rate).replace(".", ",")}×`;
}
