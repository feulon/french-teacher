// Datas locais no fuso configurado. O servidor pode estar em UTC; "hoje" é sempre
// o dia de quem estuda.

const dayFormat = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let format = dayFormat.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    dayFormat.set(timeZone, format);
  }
  return format;
}

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsOf(epochMs: number, timeZone: string): Parts {
  const values: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(new Date(epochMs))) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** Dia local (AAAA-MM-DD) de um instante em segundos. */
export function dayKey(epochSeconds: number, timeZone: string): string {
  const { year, month, day } = partsOf(epochSeconds * 1000, timeZone);
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

function parseDayKey(key: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) throw new Error(`Dia inválido: ${key}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Soma dias a um dia local (aritmética de calendário, sem fuso). */
export function addDays(key: string, days: number): string {
  const { year, month, day } = parseDayKey(key);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Dia da semana de um dia local, com segunda = 0. */
export function weekdayIndexOf(key: string): number {
  const { year, month, day } = parseDayKey(key);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

// Diferença entre o relógio local do fuso e o UTC naquele instante.
function offsetMs(epochMs: number, timeZone: string): number {
  const p = partsOf(epochMs, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(epochMs / 1000) * 1000;
}

/** Início (00:00 local), em segundos, de um dia local. Resolve a mudança de horário de verão. */
export function startOfDay(key: string, timeZone: string): number {
  const { year, month, day } = parseDayKey(key);
  const naive = Date.UTC(year, month - 1, day);
  const first = naive - offsetMs(naive, timeZone);
  const second = naive - offsetMs(first, timeZone);
  return Math.floor(second / 1000);
}

/** Primeiro instante do dia seguinte ao de `epochSeconds`, no fuso. */
export function startOfNextDay(epochSeconds: number, timeZone: string): number {
  return startOfDay(addDays(dayKey(epochSeconds, timeZone), 1), timeZone);
}
