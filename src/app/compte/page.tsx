import Link from "next/link";
import { SpaceHeader } from "@/components/space-header";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ComptePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: { orders: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <RealtimeRefresh />
      <SpaceHeader title="Mon compte" />
      <main className="flex-1 space-y-6 p-4">
        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Cumul fidélité</p>
          <p className="text-2xl font-semibold text-red-800">
            {((user?.loyaltyCentsCumulated ?? 0) / 100).toFixed(2)} €
          </p>
        </section>

        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 rounded-lg bg-red-800 py-2.5 text-center font-medium text-white hover:bg-red-900"
          >
            Commander
          </Link>
          <Link
            href="/reservations"
            className="flex-1 rounded-lg border border-red-800 py-2.5 text-center font-medium text-red-800 hover:bg-red-50"
          >
            Réserver une table
          </Link>
        </div>

        <div className="flex gap-3 text-sm">
          <Link href="/avis" className="flex-1 text-center text-neutral-600 underline">
            Avis clients
          </Link>
          <Link href="/aide" className="flex-1 text-center text-neutral-600 underline">
            Aide / signaler un problème
          </Link>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Dernières commandes
          </h2>
          <div className="space-y-2">
            {user?.orders.length === 0 && (
              <p className="text-sm text-neutral-500">Aucune commande pour l&apos;instant.</p>
            )}
            {user?.orders.map((order) => (
              <Link
                key={order.id}
                href={`/commandes/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3"
              >
                <span>#{order.id.slice(-6)} — {order.mode}</span>
                <span className="text-sm text-neutral-500">{order.status}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
