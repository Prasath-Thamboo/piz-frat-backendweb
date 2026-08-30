"use server";

import { revalidatePath } from "next/cache";
import { acceptOrder, refuseOrder } from "@/lib/admin-orders";
import { cancelReservationAsAdmin, setRoomZoneStatus } from "@/lib/reservations";
import { replyToReview, setReviewPublished, deleteReviewAsAdmin } from "@/lib/reviews";
import { resolveFeedbackAsAdmin, type ResolveFeedbackInput } from "@/lib/feedback";
import { requireAdmin } from "@/lib/require-admin";
import type { RoomZone, RoomAvailability } from "@/generated/prisma/enums";

type ActionResult = { error: string } | { ok: true };

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

export async function cancelReservationAction(reservationId: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await cancelReservationAsAdmin(reservationId);
  if ("ok" in result) revalidatePath("/admin/reservations");
  return result;
}

export async function setZoneStatusAction(
  zone: RoomZone,
  status: RoomAvailability,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await setRoomZoneStatus(zone, status);
  revalidatePath("/admin/reservations");
  revalidatePath("/reservations");
  return result;
}

export async function replyToReviewAction(reviewId: string, reply: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await replyToReview(reviewId, reply);
  if ("ok" in result) {
    revalidatePath("/admin/avis");
    revalidatePath("/avis");
  }
  return result;
}

export async function setReviewPublishedAction(
  reviewId: string,
  published: boolean,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await setReviewPublished(reviewId, published);
  if ("ok" in result) {
    revalidatePath("/admin/avis");
    revalidatePath("/avis");
  }
  return result;
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await deleteReviewAsAdmin(reviewId);
  if ("ok" in result) {
    revalidatePath("/admin/avis");
    revalidatePath("/avis");
  }
  return result;
}

export async function resolveFeedbackAction(
  feedbackId: string,
  input: ResolveFeedbackInput,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await resolveFeedbackAsAdmin(feedbackId, input);
  if ("ok" in result) {
    revalidatePath("/admin/signalements");
    revalidatePath("/aide");
  }
  return result;
}
