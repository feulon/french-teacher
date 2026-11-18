import type { Metadata } from "next";
import { CardFlow } from "@/components/exercise/CardFlow";
import { EmptyStep } from "@/components/exercise/EmptyStep";
import { requireSession } from "@/lib/auth";
import { lessonForToday } from "@/content";
import { newWordsSession } from "@/lib/study";
import { studyContext } from "@/lib/study-context";

export const metadata: Metadata = { title: "Palavras novas" };

export default async function Page() {
  await requireSession();
  const lesson = lessonForToday();
  const cards = newWordsSession(studyContext());

  if (cards.length === 0) {
    return (
      <EmptyStep
        eyebrow="Palavras novas"
        title="Nenhuma palavra nova."
        top={["Palavras novas", lesson.title]}
        lines={[
          `Você já viu as ${lesson.items.length} palavras desta aula.`,
          "Elas voltam nos Cartões, na hora certa de revisar.",
        ]}
        action={{ href: "/cartoes", label: "Ver meus cartões" }}
        secondary={{ href: "/", label: "Voltar para Hoje" }}
      />
    );
  }
  return <CardFlow stepId="words" cards={cards} />;
}
