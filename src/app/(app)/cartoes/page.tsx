import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Cartões" };

export default async function Page() {
  await requireSession();
  return (
    <ComingSoon
      title="Cartões"
      description="Os cartões de repetição espaçada ainda não existem. Eles chegam numa próxima fase, junto com os exercícios."
    />
  );
}
