import { SpaceHeader } from "@/components/space-header";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { expireStaleProposalsAndReassign } from "@/lib/delivery";
import { ProposalActions } from "./proposal-actions";
import { DeliveredButton } from "./delivered-button";

export default async function LivreurPage() {
  const session = await auth();

  // Réattribution paresseuse des propositions expirées (§6.1, §7.2) —
  // vérifiée à chaque chargement de la page en l'absence de tâche de fond.
  await expireStaleProposalsAndReassign();

  const [proposals, activeDeliveries] = await Promise.all([
    prisma.deliveryProposal.findMany({
      where: { livreurId: session!.user.id, status: "PROPOSEE" },
      include: { order: { include: { address: true } } },
      orderBy: { proposedAt: "asc" },
    }),
    prisma.deliveryProposal.findMany({
      where: { livreurId: session!.user.id, status: "ACCEPTEE", order: { status: "EN_LIVRAISON" } },
      include: { order: { include: { address: true } } },
      orderBy: { respondedAt: "asc" },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <RealtimeRefresh />
      <SpaceHeader title="Espace livreur" />
      <main className="flex-1 space-y-6 p-4">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Propositions</h2>
          {proposals.length === 0 && (
            <p className="text-sm text-neutral-500">Aucune proposition de livraison pour le moment.</p>
          )}
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">Commande #{proposal.order.id.slice(-6)}</p>
                <p className="text-sm text-neutral-600">
                  {proposal.order.address
                    ? `${proposal.order.address.line1}, ${proposal.order.address.postalCode} ${proposal.order.address.city}`
                    : "Adresse non renseignée"}
                </p>
              </div>
              <ProposalActions proposalId={proposal.id} />
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Livraisons en cours</h2>
          {activeDeliveries.length === 0 && (
            <p className="text-sm text-neutral-500">Aucune livraison en cours.</p>
          )}
          {activeDeliveries.map((proposal) => (
            <div
              key={proposal.id}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">Commande #{proposal.order.id.slice(-6)}</p>
                <p className="text-sm text-neutral-600">
                  {proposal.order.address
                    ? `${proposal.order.address.line1}, ${proposal.order.address.postalCode} ${proposal.order.address.city}`
                    : "Adresse non renseignée"}
                </p>
              </div>
              <DeliveredButton orderId={proposal.order.id} />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
