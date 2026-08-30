import { redirect } from "next/navigation";
import { SpaceHeader } from "@/components/space-header";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReservationsView } from "./reservations-view";

export default async function ReservationsPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const [reservations, settings] = await Promise.all([
    prisma.reservation.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    }),
    prisma.restaurantSettings.findUnique({ where: { id: "settings" } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Réserver une table" />
      <main className="flex-1 p-4">
        <ReservationsView
          reservations={reservations.map((r) => ({
            id: r.id,
            zone: r.zone,
            date: r.date.toISOString(),
            partySize: r.partySize,
            status: r.status,
          }))}
          roomStatus={settings?.roomStatus ?? "DISPONIBLE"}
          terraceStatus={settings?.terraceStatus ?? "DISPONIBLE"}
        />
      </main>
    </div>
  );
}
