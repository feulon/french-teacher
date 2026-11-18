import { dayKey } from "./time";

const pad = (n: number) => String(n).padStart(2, "0");

/** "em 8 min", "hoje às 15:30", "amanhã", "em 4 dias": quando algo volta a vencer. */
export function describeWhen(target: number, now: number, timeZone: string): string {
  const seconds = target - now;
  if (seconds < 60 * 60) return `em ${Math.max(1, Math.round(seconds / 60))} min`;

  const today = dayKey(now, timeZone);
  const day = dayKey(target, timeZone);
  if (day === today) {
    const parts = new Intl.DateTimeFormat("pt-BR", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(target * 1000));
    const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
    const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
    return `hoje às ${pad(Number(hour))}:${minute}`;
  }

  const days = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  return days === 1 ? "amanhã" : `em ${days} dias`;
}
