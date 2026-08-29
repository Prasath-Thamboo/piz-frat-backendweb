"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { acceptProposal, refuseProposal, markDelivered } from "@/lib/delivery";

type ActionResult = { error: string } | { ok: true };

async function requireLivreur(): Promise<{ userId: string } | { error: string }> {
  const session = await auth();
  if (session?.user.role !== "LIVREUR") return { error: "Non autorisé." };
  return { userId: session.user.id };
}

export async function acceptProposalAction(proposalId: string): Promise<ActionResult> {
  const auth = await requireLivreur();
  if ("error" in auth) return auth;

  const result = await acceptProposal(auth.userId, proposalId);
  if ("ok" in result) revalidatePath("/livreur");
  return result;
}

export async function refuseProposalAction(proposalId: string): Promise<ActionResult> {
  const auth = await requireLivreur();
  if ("error" in auth) return auth;

  const result = await refuseProposal(auth.userId, proposalId);
  if ("ok" in result) revalidatePath("/livreur");
  return result;
}

export async function markDeliveredAction(orderId: string): Promise<ActionResult> {
  const auth = await requireLivreur();
  if ("error" in auth) return auth;

  const result = await markDelivered(auth.userId, orderId);
  if ("ok" in result) revalidatePath("/livreur");
  return result;
}
