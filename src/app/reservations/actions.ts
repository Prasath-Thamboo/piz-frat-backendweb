"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createReservationForUser,
  cancelReservationForUser,
  type CreateReservationInput,
  type CreateReservationResult,
} from "@/lib/reservations";

export async function createReservation(
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  const session = await auth();
  if (!session) return { error: "Vous devez être connecté pour réserver." };

  const result = await createReservationForUser(session.user.id, input);
  if ("reservationId" in result) revalidatePath("/reservations");
  return result;
}

export async function cancelReservation(
  reservationId: string,
): Promise<{ error: string } | { ok: true }> {
  const session = await auth();
  if (!session) return { error: "Non authentifié." };

  const result = await cancelReservationForUser(session.user.id, reservationId);
  if ("ok" in result) revalidatePath("/reservations");
  return result;
}
