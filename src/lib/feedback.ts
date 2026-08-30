import { prisma } from "@/lib/prisma";
import type { FeedbackStatus } from "@/generated/prisma/enums";

// Signalement de problème (§3.7) et traitement admin (§4.1, §3.7) : le
// destinataire retenu ici est l'administrateur seul (le cahier des charges
// laisse ce point ouvert — pas de service client dédié dans ce build).

export type CreateFeedbackInput = { message: string; orderId?: string };
export type CreateFeedbackResult = { error: string } | { feedbackId: string };

export async function createFeedbackForUser(
  userId: string,
  input: CreateFeedbackInput,
): Promise<CreateFeedbackResult> {
  const message = input.message.trim();
  if (!message) return { error: "Décrivez le problème rencontré." };

  let orderId: string | undefined;
  if (input.orderId) {
    const order = await prisma.order.findFirst({ where: { id: input.orderId, userId } });
    if (!order) return { error: "Commande invalide." };
    orderId = order.id;
  }

  const feedback = await prisma.feedback.create({
    data: { userId, message, orderId },
  });

  return { feedbackId: feedback.id };
}

// --- Administration (§4.1, §3.7) ----------------------------------------

export type ResolveFeedbackInput = {
  status: Extract<FeedbackStatus, "EN_COURS" | "RESOLU">;
  resolution?: string;
  refundCents?: number;
};

export async function resolveFeedbackAsAdmin(
  feedbackId: string,
  input: ResolveFeedbackInput,
): Promise<{ error: string } | { ok: true }> {
  const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
  if (!feedback) return { error: "Signalement introuvable." };

  if (
    input.refundCents !== undefined &&
    (!Number.isInteger(input.refundCents) || input.refundCents < 0)
  ) {
    return { error: "Montant de remboursement invalide." };
  }

  await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      status: input.status,
      resolution: input.resolution?.trim() || undefined,
      refundCents: input.refundCents,
      resolvedAt: input.status === "RESOLU" ? new Date() : undefined,
    },
  });

  return { ok: true };
}
