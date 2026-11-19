import type { Metadata } from "next";
import { ListenFlow } from "@/components/exercise/ListenFlow";
import { requireSession } from "@/lib/auth";
import { lessonForToday } from "@/content";

export const metadata: Metadata = { title: "Escutar e falar" };

export default async function Page() {
  await requireSession();
  const lesson = lessonForToday();
  const phrases = lesson.listen.map(({ id, example }) => ({
    id,
    fr: example.fr,
    ipa: example.ipa,
    pt: example.pt,
    highlight: example.highlight,
  }));
  return <ListenFlow phrases={phrases} source={lesson.title} />;
}
