"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { acceptOrder, refuseOrder } from "@/lib/admin-orders";

type ActionResult = { error: string } | { ok: true };

async function requireAdmin(): Promise<{ error: string } | null> {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return { error: "Non autorisé." };
  return null;
}

export async function acceptOrderAction(orderId: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await acceptOrder(orderId);
  if ("ok" in result) revalidatePath("/admin");
  return result;
}

export async function refuseOrderAction(orderId: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await refuseOrder(orderId);
  if ("ok" in result) revalidatePath("/admin");
  return result;
}
