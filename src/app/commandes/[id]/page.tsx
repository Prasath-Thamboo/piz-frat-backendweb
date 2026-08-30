import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { CancelButton } from "./cancel-button";

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente de validation",
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

export default async function CommandePage(
  props: PageProps<"/commandes/[id]">,
) {
  const { id } = await props.params;
  const session = await auth();
  if (!session) redirect(`/connexion?callbackUrl=/commandes/${id}`);

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      address: true,
      items: { include: { product: true, supplements: { include: { supplement: true } } } },
    },
  });
  if (!order) notFound();

  const totalMinutes = order.estimatedMinutes + order.extraDelayMinutes;

  return (
    <div className="flex min-h-screen flex-col">
      <RealtimeRefresh />
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            Pizza Fratelli
          </p>
          <h1 className="text-lg font-semibold">
            Commande #{order.id.slice(-6)}
          </h1>
        </div>
        <Link href="/compte" className="text-sm text-neutral-500 underline">
          Mon compte
        </Link>
      </header>

      <main className="flex-1 space-y-6 p-4">
        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
            <span className="text-sm text-neutral-500">
              {order.mode === "LIVRAISON" ? "Livraison" : "À emporter"}
            </span>
          </div>
          {order.status === "EN_ATTENTE" && (
            <p className="mt-2 text-sm text-neutral-500">
              Délai estimé : environ {totalMinutes} min
              {order.extraDelayMinutes > 0 && " (délai allongé par le restaurant)"}.
            </p>
          )}
          {order.mode === "LIVRAISON" && order.address && (
            <p className="mt-1 text-sm text-neutral-500">
              Livraison à : {order.address.line1}, {order.address.postalCode}{" "}
              {order.address.city}
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">Articles</h2>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <span>
                  {item.quantity} × {item.product.name}
                </span>
                <span className="font-medium">
                  {(
                    (item.unitPriceCents +
                      item.supplements.reduce((s, x) => s + x.priceCents, 0)) *
                    item.quantity /
                    100
                  ).toFixed(2)}{" "}
                  €
                </span>
              </div>
              {item.supplements.length > 0 && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  +{" "}
                  {item.supplements.map((s) => s.supplement.name).join(", ")}
                </p>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 text-sm font-semibold">
            <span>Total</span>
            <span className="text-red-800">
              {(order.totalCents / 100).toFixed(2)} €
            </span>
          </div>
        </section>

        {order.status === "EN_ATTENTE" && <CancelButton orderId={order.id} />}
      </main>
    </div>
  );
}
