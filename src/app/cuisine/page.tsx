import { SpaceHeader } from "@/components/space-header";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { prisma } from "@/lib/prisma";
import { OrderActions } from "./order-actions";

const STATUS_LABELS: Record<string, string> = {
  ACCEPTEE: "Acceptée",
  EN_PREPARATION: "En préparation",
  PRETE: "Prête",
};

// Le cuisinier ne voit que les commandes acceptées à préparer (§5, §5.2) —
// aucun accès carte / promotions / utilisateurs / salle / livreurs.
export default async function CuisinePage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["ACCEPTEE", "EN_PREPARATION", "PRETE"] } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <RealtimeRefresh />
      <SpaceHeader title="Espace cuisine" />
      <main className="flex-1 space-y-3 p-4">
        {orders.length === 0 && (
          <p className="text-sm text-neutral-500">Aucune commande à préparer pour le moment.</p>
        )}
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="font-medium">Commande #{order.id.slice(-6)}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
                <span className="text-xs text-neutral-400">
                  {order.mode === "LIVRAISON" ? "Livraison" : "À emporter"}
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
            <OrderActions orderId={order.id} status={order.status} mode={order.mode} />
          </div>
        ))}
      </main>
    </div>
  );
}
