import type { Metadata } from "next";
import { CardFlow } from "@/components/exercise/CardFlow";
import { EmptyStep } from "@/components/exercise/EmptyStep";
import { requireSession } from "@/lib/auth";
import { lessonForToday } from "@/content";
import { describeWhen } from "@/lib/relative-time";
import { reviewSession } from "@/lib/study";
import { studyContext } from "@/lib/study-context";

export const metadata: Metadata = { title: "Revisar cartões" };

export default async function Page() {
  await requireSession();
  const ctx = studyContext();
  const session = reviewSession(ctx);

  if (session.cards.length > 0) return <CardFlow stepId="review" cards={session.cards} />;

  const top = ["Revisar", lessonForToday().title] as const;

  // Primeira vez: ainda não há nada visto para revisar.
  if (session.seen === 0) {
    return (
      <EmptyStep
        eyebrow="Revisar cartões"
        title="Ainda não há o que revisar."
        top={top}
        lines={[
          "Você ainda não viu nenhuma palavra.",
          "Depois de Palavras novas, os cartões aparecem aqui na hora de revisar.",
        ]}
        action={{ href: "/aula/palavras", label: "Ir para Palavras novas" }}
        secondary={{ href: "/", label: "Voltar para Hoje" }}
      />
    );
  }

  return (
    <EmptyStep
      eyebrow="Revisar cartões"
      title="Tudo revisado por agora."
      top={top}
      lines={[
        "Nenhum cartão venceu neste momento.",
        session.nextDue === null
          ? "Quando houver cartões agendados, eles aparecem aqui."
          : `O próximo volta ${describeWhen(session.nextDue, ctx.now, ctx.timeZone)}.`,
      ]}
      action={{ href: "/", label: "Voltar para Hoje" }}
      secondary={{ href: "/cartoes", label: "Ver meus cartões" }}
    />
  );
}
