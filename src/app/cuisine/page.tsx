import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";

// Le cuisinier ne voit que les commandes acceptées à préparer (§5, §5.2) —
// aucun accès carte / promotions / utilisateurs / salle / livreurs.
export default async function CuisinePage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["ACCEPTEE", "EN_PREPARATION"] } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Espace cuisine" />
      <main className="flex-1 space-y-3 p-4">
        {orders.length === 0 && (
          <p className="text-sm text-neutral-500">Aucune commande à préparer pour le moment.</p>
        )}
        {orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">Commande #{order.id.slice(-6)}</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {order.status}
              </span>
            </div>
            <ul className="text-sm text-neutral-600">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity} × {item.product.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </main>
    </div>
  );
}
