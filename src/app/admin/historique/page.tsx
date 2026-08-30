import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { OrderMode, OrderStatus } from "@/generated/prisma/enums";

const STATUS_LABELS: Record<OrderStatus, string> = {
  EN_ATTENTE: "En attente",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
  EN_PREPARATION: "En préparation",
  PRETE: "Prête",
  EN_LIVRAISON: "En livraison",
  LIVREE: "Livrée",
  RETIREE: "Retirée",
  CLOTUREE: "Clôturée",
  ANNULEE: "Annulée",
};

const ORDER_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

const MAX_RESULTS = 200;

export default async function AdminHistoriquePage(
  props: PageProps<"/admin/historique">,
) {
  const params = await props.searchParams;
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : "";
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : "";
  const status = typeof params.status === "string" ? params.status : "";
  const mode = typeof params.mode === "string" ? params.mode : "";
  const montantMin = typeof params.montantMin === "string" ? params.montantMin : "";
  const montantMax = typeof params.montantMax === "string" ? params.montantMax : "";

  const where: Prisma.OrderWhereInput = {};

  if (status && (ORDER_STATUSES as string[]).includes(status)) {
    where.status = status as OrderStatus;
  }
  if (mode === "LIVRAISON" || mode === "EMPORTER") {
    where.mode = mode as OrderMode;
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (montantMin || montantMax) {
    where.totalCents = {};
    if (montantMin) where.totalCents.gte = Math.round(Number(montantMin) * 100);
    if (montantMax) where.totalCents.lte = Math.round(Number(montantMax) * 100);
  }

  const orders = await prisma.order.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: MAX_RESULTS,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Historique global des commandes" />
      <main className="flex-1 space-y-4 p-4">
        <form
          method="get"
          className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-3 md:grid-cols-6"
        >
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Du</span>
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Au</span>
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo}
              className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Statut</span>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            >
              <option value="">Tous</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Mode</span>
            <select
              name="mode"
              defaultValue={mode}
              className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            >
              <option value="">Tous</option>
              <option value="LIVRAISON">Livraison</option>
              <option value="EMPORTER">À emporter</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Montant min (€)</span>
            <input
              type="number"
              step="0.01"
              min={0}
              name="montantMin"
              defaultValue={montantMin}
              className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Montant max (€)</span>
            <input
              type="number"
              step="0.01"
              min={0}
              name="montantMax"
              defaultValue={montantMax}
              className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </label>
          <div className="col-span-2 flex items-end gap-2 sm:col-span-3 md:col-span-6">
            <button
              type="submit"
              className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white"
            >
              Filtrer
            </button>
            <a
              href="/admin/historique"
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
            >
              Réinitialiser
            </a>
          </div>
        </form>

        <p className="text-xs text-neutral-400">
          {orders.length} commande{orders.length > 1 ? "s" : ""}
          {orders.length === MAX_RESULTS ? " (limite atteinte, affinez les filtres)" : ""}
        </p>

        <div className="space-y-2">
          {orders.length === 0 && (
            <p className="text-sm text-neutral-500">Aucune commande pour ces filtres.</p>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  #{o.id.slice(-6)} — {o.user.name}
                </p>
                <p className="text-neutral-500">
                  {o.createdAt.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  {" — "}
                  {o.mode === "LIVRAISON" ? "Livraison" : "À emporter"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-red-800">
                  {(o.totalCents / 100).toFixed(2)} €
                </span>
                <span className="text-neutral-500">{STATUS_LABELS[o.status]}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
