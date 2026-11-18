import { describe, expect, it } from "vitest";
import { buildWeek, formatLongDate, lessonToday, totalMinutes } from "./lesson";

describe("buildWeek", () => {
  it("quarta: segunda e terça feitas, quarta é hoje, resto aberto", () => {
    const week = buildWeek(new Date("2026-11-18T15:00:00Z"), "America/Sao_Paulo");
    expect(week.map((d) => d.letter)).toEqual(["S", "T", "Q", "Q", "S", "S", "D"]);
    expect(week.map((d) => d.state)).toEqual([
      "done", "done", "today", "upcoming", "upcoming", "upcoming", "upcoming",
    ]);
  });

  it("segunda: nenhum dia feito", () => {
    const week = buildWeek(new Date("2026-11-16T15:00:00Z"), "America/Sao_Paulo");
    expect(week[0].state).toBe("today");
    expect(week.filter((d) => d.state === "done")).toHaveLength(0);
  });

  it("domingo: seis dias feitos", () => {
    const week = buildWeek(new Date("2026-11-22T15:00:00Z"), "America/Sao_Paulo");
    expect(week[6].state).toBe("today");
    expect(week.filter((d) => d.state === "done")).toHaveLength(6);
  });

  it("usa o fuso informado, não o do servidor", () => {
    // 01:00 UTC de quinta ainda é quarta à noite em São Paulo.
    const week = buildWeek(new Date("2026-11-19T01:00:00Z"), "America/Sao_Paulo");
    expect(week[2].state).toBe("today");
  });
});

describe("formatLongDate", () => {
  it("escreve a data em português", () => {
    expect(formatLongDate(new Date("2026-11-18T15:00:00Z"), "America/Sao_Paulo")).toBe(
      "quarta, 18 de novembro",
    );
  });
});

describe("lessonToday", () => {
  it("tem as 5 etapas do capítulo 1 somando 20 minutos", () => {
    expect(lessonToday.steps.map((s) => s.label)).toEqual([
      "Revisar 8 cartões",
      "6 palavras novas",
      "Escutar e falar",
      "Escrever",
      "Conversar com a IA",
    ]);
    expect(totalMinutes(lessonToday)).toBe(20);
  });
});
