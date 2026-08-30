import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/enums";

// Statuts qui ne représentent pas du chiffre d'affaires réel (jamais
// honorées) — exclues du CA et du classement produits (§4.9).
const EXCLUDED_REVENUE_STATUSES: OrderStatus[] = ["REFUSEE", "ANNULEE"];

function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function AdminStatistiquesPage(
  props: PageProps<"/admin/statistiques">,
) {
  const params = await props.searchParams;

  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const fromParam = typeof params.from === "string" ? params.from : "";
  const toParam = typeof params.to === "string" ? params.to : "";

  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : now;
  to.setHours(23, 59, 59, 999);

  const period = { createdAt: { gte: from, lte: to } };
  const validPeriod = {
    createdAt: { gte: from, lte: to },
    status: { notIn: EXCLUDED_REVENUE_STATUSES },
  };

  const [ordersReceived, revenue, topItems] = await Promise.all([
    prisma.order.count({ where: period }),
    prisma.order.aggregate({
      where: validPeriod,
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: validPeriod },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
  ]);

  const products = await prisma.product.findMany({
    where: { id: { in: topItems.map((i) => i.productId) } },
    select: { id: true, name: true },
  });
  const productNameById = new Map(products.map((p) => [p.id, p.name]));

  const revenueCents = revenue._sum.totalCents ?? 0;
  const validOrdersCount = revenue._count;
  const averageBasketCents = validOrdersCount > 0 ? Math.round(revenueCents / validOrdersCount) : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Tableau de bord et statistiques" />
      <main className="flex-1 space-y-4 p-4">
        <form
          method="get"
          className="flex flex-wrap items-end gap-2 rounded-xl border border-neutral-200 bg-white p-4"
        >
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Du</span>
            <input
              type="date"
              name="from"
              defaultValue={toDateInputValue(from)}
              className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Au</span>
            <input
              type="date"
              name="to"
              defaultValue={toDateInputValue(to)}
              className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </label>
          <button type="submit" className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white">
            Filtrer
          </button>
        </form>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Commandes reçues</p>
            <p className="text-3xl font-semibold">{ordersReceived}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Chiffre d&apos;affaires</p>
            <p className="text-3xl font-semibold text-red-800">
              {(revenueCents / 100).toFixed(2)} €
            </p>
            <p className="text-xs text-neutral-400">
              {validOrdersCount} commande{validOrdersCount > 1 ? "s" : ""} honorée
              {validOrdersCount > 1 ? "s" : ""} (hors refusées/annulées)
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Panier moyen</p>
            <p className="text-3xl font-semibold">{(averageBasketCents / 100).toFixed(2)} €</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">Produits les plus vendus</h2>
          {topItems.length === 0 && (
            <p className="text-sm text-neutral-500">Aucune vente sur cette période.</p>
          )}
          {topItems.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 text-sm"
            >
              <span>{productNameById.get(item.productId) ?? "Produit supprimé"}</span>
              <span className="font-medium text-red-800">
                {item._sum.quantity ?? 0} vendu{(item._sum.quantity ?? 0) > 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
