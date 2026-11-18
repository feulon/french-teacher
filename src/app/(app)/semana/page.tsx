import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Semana" };

export default async function Page() {
  await requireSession();
  return (
    <ComingSoon
      title="Semana"
      description="Seu cronograma da semana, com a aula de cada dia, chega numa próxima fase. Por enquanto, a aula de hoje está na aba Hoje."
    />
  );
}
