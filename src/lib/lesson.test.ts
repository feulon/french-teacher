import { describe, expect, it } from "vitest";
import { lessonForToday } from "@/content";
import {
  buildTodayLesson,
  buildWeek,
  formatLongDate,
  totalMinutes,
  weekRange,
  type TodayInputs,
} from "./lesson";

const SP = "America/Sao_Paulo";
const lesson = lessonForToday();

describe("buildWeek", () => {
  const wednesday = new Date("2026-11-18T15:00:00Z");

  it("sem estudo: dias anteriores em branco, hoje marcado, resto aberto", () => {
    const week = buildWeek(wednesday, SP, new Set());
    expect(week.map((d) => d.letter)).toEqual(["S", "T", "Q", "Q", "S", "S", "D"]);
    expect(week.map((d) => d.state)).toEqual([
      "missed", "missed", "today", "upcoming", "upcoming", "upcoming", "upcoming",
    ]);
    expect(week.map((d) => d.day)[0]).toBe("2026-11-16");
  });

  it("marca como feitos os dias realmente estudados, inclusive hoje", () => {
    const week = buildWeek(wednesday, SP, new Set(["2026-11-17", "2026-11-18"]));
    expect(week.map((d) => d.state)).toEqual([
      "missed", "done", "done", "upcoming", "upcoming", "upcoming", "upcoming",
    ]);
  });

  it("segunda: nenhum dia anterior", () => {
    const week = buildWeek(new Date("2026-11-16T15:00:00Z"), SP, new Set());
    expect(week[0].state).toBe("today");
    expect(week.filter((d) => d.state === "missed")).toHaveLength(0);
  });

  it("domingo: a semana vai de segunda a domingo", () => {
    const week = buildWeek(new Date("2026-11-22T15:00:00Z"), SP, new Set());
    expect(week[6].state).toBe("today");
    expect(week.filter((d) => d.state === "missed")).toHaveLength(6);
  });

  it("usa o fuso informado, não o do servidor", () => {
    // 01:00 UTC de quinta ainda é quarta à noite em São Paulo.
    const week = buildWeek(new Date("2026-11-19T01:00:00Z"), SP, new Set());
    expect(week[2].state).toBe("today");
  });

  it("weekRange devolve segunda e domingo", () => {
    expect(weekRange(wednesday, SP)).toEqual({ from: "2026-11-16", to: "2026-11-22" });
  });
});

describe("formatLongDate", () => {
  it("escreve a data em português", () => {
    expect(formatLongDate(new Date("2026-11-18T15:00:00Z"), SP)).toBe("quarta, 18 de novembro");
  });
});

describe("buildTodayLesson", () => {
  const base: TodayInputs = {
    lesson,
    dueCount: 0,
    newRemaining: 12,
    doneToday: new Set(),
    studiedToday: false,
  };
  const statuses = (input: TodayInputs) => buildTodayLesson(input).steps.map((s) => `${s.id}:${s.status}`);

  it("tem as 5 etapas do capítulo 1 somando 20 minutos", () => {
    const view = buildTodayLesson(base);
    expect(view.steps.map((s) => s.id)).toEqual(["review", "words", "listen", "write", "chat"]);
    expect(totalMinutes(lesson)).toBe(20);
  });

  it("primeira vez: revisão vazia, palavras novas pendentes, começa por elas", () => {
    const view = buildTodayLesson(base);
    expect(statuses(base)).toEqual([
      "review:empty", "words:pending", "listen:pending", "write:soon", "chat:soon",
    ]);
    expect(view.steps[1].label).toBe("12 palavras novas");
    expect(view.nextHref).toBe("/aula/palavras");
    expect(view.phase).toBe("fresh");
  });

  it("com cartões vencidos, a revisão vem primeiro", () => {
    const view = buildTodayLesson({ ...base, dueCount: 3, newRemaining: 0, studiedToday: false });
    expect(view.steps[0].label).toBe("Revisar 3 cartões");
    expect(view.steps[0].status).toBe("pending");
    expect(view.steps[1].status).toBe("done");
    expect(view.nextHref).toBe("/aula/revisar");
  });

  it("um cartão no singular", () => {
    expect(buildTodayLesson({ ...base, dueCount: 1 }).steps[0].label).toBe("Revisar 1 cartão");
    expect(buildTodayLesson({ ...base, newRemaining: 1 }).steps[1].label).toBe("1 palavra nova");
  });

  it("palavras novas feitas e escuta pendente: continua", () => {
    const input = { ...base, newRemaining: 0, doneToday: new Set(["words"]), studiedToday: true };
    const view = buildTodayLesson(input);
    expect(view.nextHref).toBe("/aula/escutar");
    expect(view.phase).toBe("started");
  });

  it("tudo o que existe feito: nada a continuar, Escrever e Conversar seguem em breve", () => {
    const input = {
      ...base,
      newRemaining: 0,
      doneToday: new Set(["words", "listen"]),
      studiedToday: true,
    };
    const view = buildTodayLesson(input);
    expect(statuses(input)).toEqual([
      "review:empty", "words:done", "listen:done", "write:soon", "chat:soon",
    ]);
    expect(view.nextHref).toBeNull();
    expect(view.phase).toBe("finished");
    expect(view.steps.filter((s) => s.status === "soon").every((s) => s.href === null)).toBe(true);
  });

  it("revisão feita hoje aparece como concluída", () => {
    const input = { ...base, newRemaining: 0, doneToday: new Set(["review"]) };
    expect(buildTodayLesson(input).steps[0]).toMatchObject({ label: "Cartões revisados", status: "done" });
  });
});
