import Link from "next/link";
import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";
import { OrderActions } from "./order-actions";

export default async function AdminHome() {
  const [pendingOrdersList, productsCount, usersCount] = await Promise.all([
    prisma.order.findMany({
      where: { status: "EN_ATTENTE" },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.product.count(),
    prisma.user.count(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Espace administrateur" />
      <main className="flex-1 space-y-6 p-4">
        <nav className="flex gap-2">
          <Link
            href="/admin/reservations"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Salle et réservations
          </Link>
        </nav>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Commandes en attente</p>
            <p className="text-3xl font-semibold text-red-800">{pendingOrdersList.length}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Produits à la carte</p>
            <p className="text-3xl font-semibold">{productsCount}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Utilisateurs</p>
            <p className="text-3xl font-semibold">{usersCount}</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">
            Commandes entrantes à valider
          </h2>
          {pendingOrdersList.length === 0 && (
            <p className="text-sm text-neutral-500">Aucune commande en attente.</p>
          )}
          {pendingOrdersList.map((order) => (
            <div
              key={order.id}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  Commande #{order.id.slice(-6)} —{" "}
                  {order.mode === "LIVRAISON" ? "Livraison" : "À emporter"}
                </p>
                <p className="text-sm text-neutral-500">
                  {order.items.map((item) => `${item.quantity} × ${item.product.name}`).join(", ")}
                </p>
                <p className="text-sm font-medium text-red-800">
                  {(order.totalCents / 100).toFixed(2)} €
                </p>
              </div>
              <OrderActions orderId={order.id} />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
