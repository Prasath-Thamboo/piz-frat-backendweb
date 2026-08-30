"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { acceptOrder, refuseOrder } from "@/lib/admin-orders";
import { cancelReservationAsAdmin, setRoomZoneStatus } from "@/lib/reservations";
import type { RoomZone, RoomAvailability } from "@/generated/prisma/enums";

type ActionResult = { error: string } | { ok: true };

async function requireAdmin(): Promise<{ error: string } | null> {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return { error: "Non autorisé." };
  return null;
}

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
