"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { cancelOrderForUser } from "@/lib/orders";

export async function cancelOrder(
  orderId: string,
): Promise<{ error: string } | { ok: true }> {
  const session = await auth();
  if (!session) return { error: "Non authentifié." };

  const result = await cancelOrderForUser(session.user.id, orderId);
  if ("ok" in result) {
    revalidatePath(`/commandes/${orderId}`);
    revalidatePath("/compte");
  }
  return result;
}
