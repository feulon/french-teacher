import { describe, expect, it } from "vitest";
import { describeWhen } from "./relative-time";

const SP = "America/Sao_Paulo";
const at = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);
const NOW = at("2026-11-18T15:00:00Z"); // 12:00 em São Paulo

describe("describeWhen", () => {
  it("menos de uma hora: em minutos", () => {
    expect(describeWhen(NOW + 10 * 60, NOW, SP)).toBe("em 10 min");
    expect(describeWhen(NOW + 20, NOW, SP)).toBe("em 1 min");
  });

  it("mais tarde no mesmo dia: a hora local", () => {
    expect(describeWhen(at("2026-11-18T18:30:00Z"), NOW, SP)).toBe("hoje às 15:30");
  });

  it("no dia seguinte: amanhã", () => {
    expect(describeWhen(at("2026-11-19T15:00:00Z"), NOW, SP)).toBe("amanhã");
  });

  it("virou o dia local mesmo com menos de 24 h: amanhã", () => {
    expect(describeWhen(at("2026-11-19T04:00:00Z"), NOW, SP)).toBe("amanhã"); // 01:00 local
  });

  it("dias adiante", () => {
    expect(describeWhen(at("2026-11-22T15:00:00Z"), NOW, SP)).toBe("em 4 dias");
  });
});
