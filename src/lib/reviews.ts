import { prisma } from "@/lib/prisma";

// Avis public sur le restaurant (§3.6) et sa modération (§4.11).

export type CreateReviewInput = { rating: number; comment: string };
export type CreateReviewResult = { error: string } | { reviewId: string };

export async function createReviewForUser(
  userId: string,
  input: CreateReviewInput,
): Promise<CreateReviewResult> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: "La note doit être comprise entre 1 et 5." };
  }
  const comment = input.comment.trim();
  if (!comment) {
    return { error: "Merci d'ajouter un commentaire." };
  }

  const review = await prisma.review.create({
    data: { userId, rating: input.rating, comment },
  });

  return { reviewId: review.id };
}

// --- Administration (§4.11) --------------------------------------------

export async function replyToReview(
  reviewId: string,
  reply: string,
): Promise<{ error: string } | { ok: true }> {
  const trimmed = reply.trim();
  if (!trimmed) return { error: "La réponse ne peut pas être vide." };

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: "Avis introuvable." };

  await prisma.review.update({ where: { id: reviewId }, data: { adminReply: trimmed } });
  return { ok: true };
}

export async function setReviewPublished(
  reviewId: string,
  published: boolean,
): Promise<{ error: string } | { ok: true }> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: "Avis introuvable." };

  await prisma.review.update({ where: { id: reviewId }, data: { published } });
  return { ok: true };
}

// "Supprimer un avis abusif" (§4.11) : suppression définitive côté modération,
// pas une action utilisateur — réservée à l'administrateur.
export async function deleteReviewAsAdmin(
  reviewId: string,
): Promise<{ error: string } | { ok: true }> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: "Avis introuvable." };

  await prisma.review.delete({ where: { id: reviewId } });
  return { ok: true };
}
