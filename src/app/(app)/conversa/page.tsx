import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Conversa" };

export default async function Page() {
  await requireSession();
  return (
    <ComingSoon
      title="Conversa"
      description="A conversa com a IA ainda não foi construída. Ela chega numa próxima fase."
    />
  );
}
