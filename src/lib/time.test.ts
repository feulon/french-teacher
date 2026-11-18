import { describe, expect, it } from "vitest";
import { addDays, dayKey, startOfDay, startOfNextDay, weekdayIndexOf } from "./time";

const SP = "America/Sao_Paulo";
const at = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

describe("dayKey", () => {
  it("usa o dia do fuso, não o do servidor", () => {
    // 01:00 UTC de quinta ainda é quarta à noite em São Paulo.
    expect(dayKey(at("2026-11-19T01:00:00Z"), SP)).toBe("2026-11-18");
    expect(dayKey(at("2026-11-19T03:00:00Z"), SP)).toBe("2026-11-19");
  });
});

describe("addDays e weekdayIndexOf", () => {
  it("atravessa mês e ano", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("segunda = 0 e domingo = 6", () => {
    expect(weekdayIndexOf("2026-11-16")).toBe(0);
    expect(weekdayIndexOf("2026-11-18")).toBe(2);
    expect(weekdayIndexOf("2026-11-22")).toBe(6);
  });

  it("recusa um dia malformado", () => {
    expect(() => addDays("18/11/2026", 1)).toThrow();
  });
});

describe("startOfDay / startOfNextDay", () => {
  it("meia-noite de São Paulo é 03:00 UTC", () => {
    expect(startOfDay("2026-11-18", SP)).toBe(at("2026-11-18T03:00:00Z"));
    expect(startOfNextDay(at("2026-11-18T15:00:00Z"), SP)).toBe(at("2026-11-19T03:00:00Z"));
  });

  it("às 23:59 locais o dia seguinte começa em um minuto", () => {
    const now = at("2026-11-19T02:59:00Z"); // 23:59 em São Paulo
    expect(startOfNextDay(now, SP) - now).toBe(60);
  });

  it("respeita o horário de verão (Paris, 29/03/2026 tem só 23 h)", () => {
    const paris = "Europe/Paris";
    expect(startOfDay("2026-03-29", paris)).toBe(at("2026-03-28T23:00:00Z"));
    expect(startOfDay("2026-03-30", paris)).toBe(at("2026-03-29T22:00:00Z"));
    expect(startOfNextDay(at("2026-03-29T12:00:00Z"), paris)).toBe(at("2026-03-29T22:00:00Z"));
  });
});
