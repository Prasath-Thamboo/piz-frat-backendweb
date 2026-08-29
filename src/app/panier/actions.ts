"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { Address } from "@/generated/prisma/client";
import {
  createOrderForUser,
  addAddressForUser,
  type CreateOrderInput,
  type CreateOrderResult,
} from "@/lib/orders";

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const session = await auth();
  if (!session) return { error: "Vous devez être connecté pour commander." };

  const result = await createOrderForUser(session.user.id, input);
  if ("orderId" in result) revalidatePath("/compte");
  return result;
}

export async function addAddress(
  formData: FormData,
): Promise<{ error: string } | { address: Address }> {
  const session = await auth();
  if (!session) return { error: "Vous devez être connecté." };

  const result = await addAddressForUser(session.user.id, {
    label: String(formData.get("label") ?? ""),
    line1: String(formData.get("line1") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    city: String(formData.get("city") ?? ""),
  });
  if ("address" in result) revalidatePath("/panier");
  return result;
}
