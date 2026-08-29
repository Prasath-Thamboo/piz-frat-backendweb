"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { takeOrder, markReady, markRetrieved } from "@/lib/kitchen";

type ActionResult = { error: string } | { ok: true };

async function requireCuisinier(): Promise<{ error: string } | null> {
  const session = await auth();
  if (session?.user.role !== "CUISINIER") return { error: "Non autorisé." };
  return null;
}

export async function takeOrderAction(orderId: string): Promise<ActionResult> {
  const denied = await requireCuisinier();
  if (denied) return denied;

  const result = await takeOrder(orderId);
  if ("ok" in result) revalidatePath("/cuisine");
  return result;
}

export async function markReadyAction(orderId: string): Promise<ActionResult> {
  const denied = await requireCuisinier();
  if (denied) return denied;

  const result = await markReady(orderId);
  if ("ok" in result) revalidatePath("/cuisine");
  return result;
}

export async function markRetrievedAction(orderId: string): Promise<ActionResult> {
  const denied = await requireCuisinier();
  if (denied) return denied;

  const result = await markRetrieved(orderId);
  if ("ok" in result) revalidatePath("/cuisine");
  return result;
}
