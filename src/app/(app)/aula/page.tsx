import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Aula" };

export default async function Page() {
  await requireSession();
  return (
    <ComingSoon
      title="Aula"
      description="Os exercícios da aula ainda não existem. Eles chegam numa próxima fase; por enquanto esta é só a tela da aula de hoje."
    />
  );
}
