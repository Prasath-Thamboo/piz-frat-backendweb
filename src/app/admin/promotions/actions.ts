"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import {
  createPromotion,
  updatePromotion,
  deletePromotion,
  setCashbackThreshold,
  type PromotionInput,
} from "@/lib/promotions";

type ActionResult = { error: string } | { ok: true };

function revalidatePromotions() {
  revalidatePath("/admin/promotions");
}

export async function createPromotionAction(input: PromotionInput) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await createPromotion(input);
  if ("promotionId" in result) revalidatePromotions();
  return result;
}

export async function updatePromotionAction(
  id: string,
  input: PromotionInput,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await updatePromotion(id, input);
  if ("ok" in result) revalidatePromotions();
  return result;
}

export async function deletePromotionAction(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await deletePromotion(id);
  if ("ok" in result) revalidatePromotions();
  return result;
}

export async function setCashbackThresholdAction(cents: number): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await setCashbackThreshold(cents);
  if ("ok" in result) revalidatePromotions();
  return result;
}
