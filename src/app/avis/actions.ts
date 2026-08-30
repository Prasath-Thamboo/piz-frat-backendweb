"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createReviewForUser,
  type CreateReviewInput,
  type CreateReviewResult,
} from "@/lib/reviews";

export async function createReview(input: CreateReviewInput): Promise<CreateReviewResult> {
  const session = await auth();
  if (!session) return { error: "Vous devez être connecté pour laisser un avis." };

  const result = await createReviewForUser(session.user.id, input);
  if ("reviewId" in result) revalidatePath("/avis");
  return result;
}
