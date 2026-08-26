import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";

export default async function AdminHome() {
  const [pendingOrders, productsCount, usersCount] = await Promise.all([
    prisma.order.count({ where: { status: "EN_ATTENTE" } }),
    prisma.product.count(),
    prisma.user.count(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Espace administrateur" />
      <main className="grid flex-1 grid-cols-1 gap-4 p-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Commandes en attente</p>
          <p className="text-3xl font-semibold text-red-800">{pendingOrders}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Produits à la carte</p>
          <p className="text-3xl font-semibold">{productsCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Utilisateurs</p>
          <p className="text-3xl font-semibold">{usersCount}</p>
        </div>
      </main>
    </div>
  );
}
