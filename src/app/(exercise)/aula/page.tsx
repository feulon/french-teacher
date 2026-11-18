import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { todayOverview } from "@/lib/study";
import { studyContext } from "@/lib/study-context";

// "Começar a aula": leva à primeira etapa que ainda falta; sem nada pendente, volta para Hoje.
export default async function Page() {
  await requireSession();
  redirect(todayOverview(studyContext()).lesson.nextHref ?? "/");
}
