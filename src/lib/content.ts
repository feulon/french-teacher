// Formato dos arquivos de conteúdo (src/content/chapters/**) e a validação deles.
// Uma aula é um JSON; as próximas aulas só adicionam arquivos e os registram em
// src/content/index.ts. Um arquivo malformado derruba o build, não a tela do aluno.

export const STEP_IDS = ["review", "words", "listen", "write", "chat"] as const;
export type StepId = (typeof STEP_IDS)[number];

export type Example = {
  readonly fr: string;
  readonly ipa: string;
  readonly pt: string;
  /** Trecho de `fr` que aparece marcado na etapa Escutar e falar. */
  readonly highlight: string;
};

export type Item = {
  readonly id: string;
  readonly fr: string;
  /** Pronúncia aproximada para quem lê português; a sílaba tônica vem em maiúsculas. */
  readonly pron: string;
  readonly ipa: string;
  readonly pt: string;
  readonly tag?: string;
  readonly note?: string;
  readonly example: Example;
};

export type StepPlan = { readonly id: StepId; readonly minutes: number };

export type Lesson = {
  readonly id: string;
  readonly chapter: { readonly number: number; readonly title: string; readonly lessonCount: number };
  readonly number: number;
  readonly title: string;
  readonly steps: readonly StepPlan[];
  readonly items: readonly Item[];
  /** Itens cujas frases de exemplo entram na etapa Escutar e falar, em ordem. */
  readonly listen: readonly Item[];
};

// Espaço fino não separável: em francês, "!", "?", ":" e ";" levam um espaço antes
// e ele não pode quebrar a linha. Os arquivos usam espaço comum; a conversão é aqui.
const NNBSP = " ";

export function frenchTypography(text: string): string {
  return text.replace(/ ([!?:;])/g, `${NNBSP}$1`);
}

type Raw = Record<string, unknown>;

function fail(where: string, problem: string): never {
  throw new Error(`Conteúdo inválido em ${where}: ${problem}`);
}

function isObject(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(source: Raw, key: string, where: string): string {
  const value = source[key];
  if (typeof value !== "string" || value.trim() === "") fail(where, `"${key}" precisa ser um texto não vazio`);
  return value.trim();
}

function optionalText(source: Raw, key: string, where: string): string | undefined {
  return source[key] === undefined ? undefined : text(source, key, where);
}

function positiveInt(source: Raw, key: string, where: string): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    fail(where, `"${key}" precisa ser um inteiro maior que zero`);
  }
  return value;
}

function ipa(source: Raw, key: string, where: string): string {
  const value = text(source, key, where);
  if (!/^\/[^/]+\/$/.test(value)) fail(where, `"${key}" precisa estar entre barras, como /bɔ̃.ʒuʁ/`);
  return value;
}

function parseItem(raw: unknown, index: number): Item {
  const where = `items[${index}]`;
  if (!isObject(raw)) fail(where, "precisa ser um objeto");
  const id = text(raw, "id", where);
  const here = `${where} (${id})`;
  if (!/^[a-z0-9-]+$/.test(id)) fail(here, '"id" só pode ter letras minúsculas, números e hífen');

  const rawExample = raw.example;
  if (!isObject(rawExample)) fail(here, '"example" precisa ser um objeto');
  const exampleFr = frenchTypography(text(rawExample, "fr", `${here}.example`));
  const highlight = frenchTypography(text(rawExample, "highlight", `${here}.example`));
  if (!exampleFr.includes(highlight)) fail(`${here}.example`, `"highlight" precisa aparecer em "fr"`);

  return {
    id,
    fr: frenchTypography(text(raw, "fr", here)),
    pron: text(raw, "pron", here),
    ipa: ipa(raw, "ipa", here),
    pt: text(raw, "pt", here),
    tag: optionalText(raw, "tag", here),
    note: optionalText(raw, "note", here),
    example: {
      fr: exampleFr,
      ipa: ipa(rawExample, "ipa", `${here}.example`),
      pt: text(rawExample, "pt", `${here}.example`),
      highlight,
    },
  };
}

function parseSteps(raw: unknown): StepPlan[] {
  if (!Array.isArray(raw) || raw.length === 0) fail("steps", "precisa ser uma lista não vazia");
  const seen = new Set<string>();
  return raw.map((entry, index) => {
    const where = `steps[${index}]`;
    if (!isObject(entry)) fail(where, "precisa ser um objeto");
    const id = text(entry, "id", where);
    if (!(STEP_IDS as readonly string[]).includes(id)) fail(where, `etapa desconhecida "${id}"`);
    if (seen.has(id)) fail(where, `etapa repetida "${id}"`);
    seen.add(id);
    return { id: id as StepId, minutes: positiveInt(entry, "minutes", where) };
  });
}

export function parseLesson(raw: unknown): Lesson {
  if (!isObject(raw)) fail("aula", "o arquivo precisa ser um objeto");
  const id = text(raw, "id", "aula");
  const where = `aula ${id}`;

  const rawChapter = raw.chapter;
  if (!isObject(rawChapter)) fail(where, '"chapter" precisa ser um objeto');

  if (!Array.isArray(raw.items) || raw.items.length === 0) fail(where, '"items" precisa ser uma lista não vazia');
  const items = raw.items.map(parseItem);
  const byId = new Map<string, Item>();
  for (const item of items) {
    if (byId.has(item.id)) fail(where, `item repetido "${item.id}"`);
    byId.set(item.id, item);
  }

  if (!Array.isArray(raw.listen) || raw.listen.length === 0) fail(where, '"listen" precisa ser uma lista não vazia');
  const listen = raw.listen.map((itemId): Item => {
    const item = typeof itemId === "string" ? byId.get(itemId) : undefined;
    if (!item) fail(where, `"listen" cita um item que não existe: ${String(itemId)}`);
    return item;
  });

  return {
    id,
    chapter: {
      number: positiveInt(rawChapter, "number", `${where}.chapter`),
      title: frenchTypography(text(rawChapter, "title", `${where}.chapter`)),
      lessonCount: positiveInt(rawChapter, "lessonCount", `${where}.chapter`),
    },
    number: positiveInt(raw, "number", where),
    title: frenchTypography(text(raw, "title", where)),
    steps: parseSteps(raw.steps),
    items,
    listen,
  };
}
