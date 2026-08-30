import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";
import { ZoneStatusToggle } from "./zone-status-toggle";
import { ReservationActions } from "./reservation-actions";

export default async function AdminReservationsPage() {
  const [reservations, settings] = await Promise.all([
    prisma.reservation.findMany({
      where: { status: "CONFIRMEE" },
      include: { user: true },
      orderBy: { date: "asc" },
    }),
    prisma.restaurantSettings.findUnique({ where: { id: "settings" } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Salle et réservations" />
      <main className="flex-1 space-y-6 p-4">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Statut de la salle</h2>
          <ZoneStatusToggle zone="SALLE" status={settings?.roomStatus ?? "DISPONIBLE"} />
          <ZoneStatusToggle zone="TERRASSE" status={settings?.terraceStatus ?? "DISPONIBLE"} />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">Réservations confirmées</h2>
          {reservations.length === 0 && (
            <p className="text-sm text-neutral-500">Aucune réservation en cours.</p>
          )}
          {reservations.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {r.zone === "SALLE" ? "Salle" : "Terrasse"} — {r.partySize} pers.
                </p>
                <p className="text-sm text-neutral-500">
                  {r.user.name} —{" "}
                  {r.date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <ReservationActions reservationId={r.id} />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
