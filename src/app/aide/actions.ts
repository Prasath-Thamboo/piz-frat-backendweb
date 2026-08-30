"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createFeedbackForUser,
  type CreateFeedbackInput,
  type CreateFeedbackResult,
} from "@/lib/feedback";

export async function createFeedback(
  input: CreateFeedbackInput,
): Promise<CreateFeedbackResult> {
  const session = await auth();
  if (!session) return { error: "Vous devez être connecté pour signaler un problème." };

  const result = await createFeedbackForUser(session.user.id, input);
  if ("feedbackId" in result) revalidatePath("/aide");
  return result;
}
