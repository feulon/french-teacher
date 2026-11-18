import { parseLesson, type Item, type Lesson } from "@/lib/content";
import aula01 from "./chapters/01-bonjour/aula-01.json";

// Para montar uma nova aula: crie o JSON ao lado da aula 1 e acrescente-o aqui, na ordem.
export const lessons: readonly Lesson[] = [parseLesson(aula01)];

// Por enquanto só o capítulo 1 existe, e a aula de hoje é a primeira.
// Escolher a aula do dia pelo cronograma fica para quando houver mais aulas.
export function lessonForToday(): Lesson {
  return lessons[0];
}

export function allItems(): readonly Item[] {
  return lessons.flatMap((lesson) => lesson.items);
}

export function findItem(itemId: string): Item | undefined {
  return allItems().find((item) => item.id === itemId);
}
