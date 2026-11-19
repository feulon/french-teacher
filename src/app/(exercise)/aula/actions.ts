"use server";

import { requireSession } from "@/lib/auth";
import { STEP_IDS, type StepId } from "@/lib/content";
import { isGrade, type CardSnapshot } from "@/lib/srs/scheduler";
import { finishStep, gradeItem } from "@/lib/study";
import { studyContext } from "@/lib/study-context";

export type GradeResult =
  | { readonly ok: true; readonly card: CardSnapshot; readonly now: number }
  | { readonly ok: false; readonly error: string };

export type FinishResult = { readonly ok: true } | { readonly ok: false; readonly error: string };

const SAVE_ERROR = "Não foi possível salvar. Tente de novo.";

// Ações de servidor são endpoints públicos: toda uma delas confere a sessão
// e valida os argumentos, que chegam do navegador sem nenhuma garantia.
export async function gradeCardAction(itemId: unknown, grade: unknown): Promise<GradeResult> {
  await requireSession();
  if (typeof itemId !== "string" || !isGrade(grade)) return { ok: false, error: SAVE_ERROR };
  try {
    const ctx = studyContext();
    return { ok: true, card: gradeItem(ctx, itemId, grade), now: ctx.now };
  } catch (error) {
    console.error("Falha ao gravar a nota do cartão:", error);
    return { ok: false, error: SAVE_ERROR };
  }
}

export async function finishStepAction(stepId: unknown): Promise<FinishResult> {
  await requireSession();
  if (typeof stepId !== "string" || !(STEP_IDS as readonly string[]).includes(stepId)) {
    return { ok: false, error: SAVE_ERROR };
  }
  try {
    finishStep(studyContext(), stepId as StepId);
    return { ok: true };
  } catch (error) {
    console.error("Falha ao concluir a etapa:", error);
    return { ok: false, error: SAVE_ERROR };
  }
}
