import { describe, expect, it } from "vitest";
import { allItems, findItem, lessonForToday, lessons } from "@/content";
import { frenchTypography, parseLesson } from "./content";

const NNBSP = " ";

describe("conteúdo do capítulo 1", () => {
  const lesson = lessonForToday();

  it("a aula 1 de 'Bonjour !' tem cerca de 12 itens e 20 minutos", () => {
    expect(lesson.id).toBe("c1-l1");
    expect(lesson.number).toBe(1);
    expect(lesson.chapter).toMatchObject({ number: 1, title: `Bonjour${NNBSP}!` });
    expect(lesson.items).toHaveLength(12);
    expect(lesson.steps.map((s) => s.id)).toEqual(["review", "words", "listen", "write", "chat"]);
    expect(lesson.steps.reduce((sum, s) => sum + s.minutes, 0)).toBe(20);
  });

  it("todo item tem francês, pronúncia, IPA, tradução e frase de exemplo", () => {
    for (const item of lesson.items) {
      expect(item.fr, item.id).not.toBe("");
      expect(item.pron, item.id).not.toBe("");
      expect(item.ipa, item.id).toMatch(/^\/.+\/$/);
      expect(item.pt, item.id).not.toBe("");
      expect(item.example.fr, item.id).toContain(item.example.highlight);
      expect(item.example.ipa, item.id).toMatch(/^\/.+\/$/);
      expect(item.example.pt, item.id).not.toBe("");
    }
  });

  it("os ids são únicos em todas as aulas", () => {
    const ids = allItems().map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
  });

  it("Escutar e falar usa itens da própria aula", () => {
    expect(lesson.listen.length).toBeGreaterThanOrEqual(4);
    for (const item of lesson.listen) expect(lesson.items).toContain(item);
  });

  it("acha item pelo id", () => {
    expect(findItem("c1l1-merci")?.fr).toBe("Merci");
    expect(findItem("não-existe")).toBeUndefined();
  });
});

describe("frenchTypography", () => {
  it("troca o espaço antes de ! ? : ; pelo espaço fino não separável", () => {
    expect(frenchTypography("Bonjour !")).toBe(`Bonjour${NNBSP}!`);
    expect(frenchTypography("Comment ça va ?")).toBe(`Comment ça va${NNBSP}?`);
    expect(frenchTypography("Salut.")).toBe("Salut.");
  });
});

describe("parseLesson", () => {
  const valid = () => ({
    id: "x-l1",
    chapter: { number: 1, title: "Bonjour !", lessonCount: 8 },
    number: 1,
    title: "Titre",
    steps: [{ id: "words", minutes: 5 }],
    listen: ["a"],
    items: [
      {
        id: "a",
        fr: "Bonjour",
        pron: "bõ-JUR",
        ipa: "/bɔ̃.ʒuʁ/",
        pt: "bom dia",
        example: { fr: "Bonjour, madame !", ipa: "/bɔ̃.ʒuʁ ma.dam/", pt: "Bom dia, senhora!", highlight: "Bonjour" },
      },
    ],
  });

  it("aceita um arquivo válido", () => {
    expect(parseLesson(valid()).items[0].example.fr).toBe(`Bonjour, madame${NNBSP}!`);
  });

  it.each([
    ["item sem tradução", (l: ReturnType<typeof valid>) => void (l.items[0].pt = " "), /"pt"/],
    ["IPA sem barras", (l: ReturnType<typeof valid>) => void (l.items[0].ipa = "bɔ̃.ʒuʁ"), /entre barras/],
    ["id repetido", (l: ReturnType<typeof valid>) => void l.items.push({ ...l.items[0] }), /repetido/],
    ["destaque que não está na frase", (l: ReturnType<typeof valid>) => void (l.items[0].example.highlight = "Salut"), /highlight/],
    ["listen com item inexistente", (l: ReturnType<typeof valid>) => void (l.listen = ["zzz"]), /não existe/],
    ["etapa desconhecida", (l: ReturnType<typeof valid>) => void (l.steps[0].id = "dance" as never), /desconhecida/],
    ["minutos inválidos", (l: ReturnType<typeof valid>) => void (l.steps[0].minutes = 0), /minutes/],
  ])("recusa %s", (_name, mutate, message) => {
    const lesson = valid();
    mutate(lesson);
    expect(() => parseLesson(lesson)).toThrow(message);
  });

  it("recusa algo que nem é objeto", () => {
    expect(() => parseLesson(null)).toThrow();
    expect(() => parseLesson([])).toThrow();
  });
});
