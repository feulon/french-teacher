import { describe, expect, it } from "vitest";
import { formatRate, pickFrenchVoice, speechSupport } from "./speech";

const voice = (lang: string, name: string, localService = true) => ({ lang, name, localService });

describe("pickFrenchVoice", () => {
  it("prefere fr-FR a outras variantes do francês", () => {
    const voices = [voice("fr-CA", "Canada"), voice("fr-FR", "France"), voice("pt-BR", "Luciana")];
    expect(pickFrenchVoice(voices)?.name).toBe("France");
  });

  it("aceita fr_FR com sublinhado (Android)", () => {
    expect(pickFrenchVoice([voice("fr_FR", "Android")])?.name).toBe("Android");
  });

  it("entre vozes iguais, prefere a que roda no aparelho", () => {
    const voices = [voice("fr-FR", "Rede", false), voice("fr-FR", "Local", true)];
    expect(pickFrenchVoice(voices)?.name).toBe("Local");
  });

  it("devolve nada se não houver francês", () => {
    expect(pickFrenchVoice([voice("pt-BR", "Luciana"), voice("en-US", "Alex")])).toBeUndefined();
    expect(pickFrenchVoice([])).toBeUndefined();
  });
});

describe("speechSupport", () => {
  it("sem a API, não há suporte", () => {
    expect(speechSupport(false, [])).toEqual({ kind: "unsupported" });
  });

  it("vozes carregadas e nenhuma em francês: avisa em vez de ler com sotaque errado", () => {
    expect(speechSupport(true, [voice("pt-BR", "Luciana")])).toEqual({ kind: "no-french-voice" });
  });

  it("lista vazia é 'ainda não sei': tenta falar", () => {
    expect(speechSupport(true, [])).toEqual({ kind: "ready" });
  });

  it("com voz em francês, está pronto", () => {
    expect(speechSupport(true, [voice("fr-FR", "Thomas")])).toEqual({ kind: "ready" });
  });
});

describe("formatRate", () => {
  it("usa vírgula decimal", () => {
    expect(formatRate(0.75)).toBe("0,75×");
    expect(formatRate(1)).toBe("1×");
  });
});
