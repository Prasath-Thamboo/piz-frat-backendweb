import { prisma } from "@/lib/prisma";
import type { RoomZone, RoomAvailability } from "@/generated/prisma/enums";

// Logique métier partagée entre la server action web du client (src/app/reservations)
// et les actions admin (src/app/admin/reservations) — cf. §3.5 / §4.6 / §7.5.

export type CreateReservationInput = {
  zone: RoomZone;
  date: string;
  partySize: number;
};

export type CreateReservationResult = { error: string } | { reservationId: string };

export async function createReservationForUser(
  userId: string,
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  if (!Number.isInteger(input.partySize) || input.partySize < 1) {
    return { error: "Nombre de convives invalide." };
  }

  const date = new Date(input.date);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    return { error: "Choisissez une date et un horaire à venir." };
  }

  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: "settings" },
  });
  const zoneStatus = input.zone === "SALLE" ? settings?.roomStatus : settings?.terraceStatus;
  if (zoneStatus === "COMPLET") {
    return {
      error:
        input.zone === "SALLE"
          ? "La salle est complète pour le moment."
          : "La terrasse est complète pour le moment.",
    };
  }

  const reservation = await prisma.reservation.create({
    data: { userId, zone: input.zone, date, partySize: input.partySize },
  });

  return { reservationId: reservation.id };
}

// Fenêtre d'annulation client : la réservation doit être encore confirmée
// et à venir (annuler une réservation passée n'a pas de sens).
export async function cancelReservationForUser(
  userId: string,
  reservationId: string,
): Promise<{ error: string } | { ok: true }> {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, userId },
  });
  if (!reservation) return { error: "Réservation introuvable." };
  if (reservation.status !== "CONFIRMEE") {
    return { error: "Cette réservation ne peut plus être annulée." };
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "ANNULEE" },
  });

  return { ok: true };
}

// --- Administration (§4.6) --------------------------------------------

export async function cancelReservationAsAdmin(
  reservationId: string,
): Promise<{ error: string } | { ok: true }> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) return { error: "Réservation introuvable." };
  if (reservation.status !== "CONFIRMEE") {
    return { error: "Cette réservation est déjà annulée." };
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "ANNULEE" },
  });

  return { ok: true };
}

export async function setRoomZoneStatus(
  zone: RoomZone,
  status: RoomAvailability,
): Promise<{ ok: true }> {
  await prisma.restaurantSettings.upsert({
    where: { id: "settings" },
    create: {
      id: "settings",
      ...(zone === "SALLE" ? { roomStatus: status } : { terraceStatus: status }),
    },
    update: zone === "SALLE" ? { roomStatus: status } : { terraceStatus: status },
  });

  return { ok: true };
}
