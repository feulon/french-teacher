import type { ReactNode } from "react";

// Telas de exercício ocupam a tela toda, sem a navegação inferior (como nos mockups).
export default function ExerciseLayout({ children }: { children: ReactNode }) {
  return <div className="shell">{children}</div>;
}
