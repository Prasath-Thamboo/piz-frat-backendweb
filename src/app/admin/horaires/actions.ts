"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { setOrderingOpen, setExtraDelay } from "@/lib/service-settings";

type ActionResult = { error: string } | { ok: true };

function revalidateService() {
  revalidatePath("/admin/horaires");
  revalidatePath("/panier");
  revalidatePath("/commandes");
}

export async function setOrderingOpenAction(open: boolean): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await setOrderingOpen(open);
  revalidateService();
  return result;
}

export async function setExtraDelayAction(minutes: number): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await setExtraDelay(minutes);
  if ("ok" in result) revalidateService();
  return result;
}
