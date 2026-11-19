import { DAY } from "./scheduler";

const HOUR = 60 * 60;
const MINUTE = 60;

/** Texto curto do intervalo que aparece no botão de nota: "1 min", "2 h", "4 dias", "2 meses". */
export function formatDelay(seconds: number): string {
  if (seconds < HOUR) return `${Math.max(1, Math.round(seconds / MINUTE))} min`;
  if (seconds < DAY) return `${Math.round(seconds / HOUR)} h`;
  const days = Math.round(seconds / DAY);
  if (days < 30) return days === 1 ? "1 dia" : `${days} dias`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? "1 mês" : `${months} meses`;
  }
  return "1 ano";
}
