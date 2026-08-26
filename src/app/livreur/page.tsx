import { SpaceHeader } from "@/components/space-header";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function LivreurPage() {
  const session = await auth();
  const proposals = await prisma.deliveryProposal.findMany({
    where: { livreurId: session!.user.id, status: "PROPOSEE" },
    include: { order: { include: { address: true } } },
    orderBy: { proposedAt: "asc" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Espace livreur" />
      <main className="flex-1 space-y-3 p-4">
        {proposals.length === 0 && (
          <p className="text-sm text-neutral-500">Aucune proposition de livraison pour le moment.</p>
        )}
        {proposals.map((proposal) => (
          <div key={proposal.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="font-medium">Commande #{proposal.order.id.slice(-6)}</p>
            <p className="text-sm text-neutral-600">
              {proposal.order.address
                ? `${proposal.order.address.line1}, ${proposal.order.address.postalCode} ${proposal.order.address.city}`
                : "Adresse non renseignée"}
            </p>
          </div>
        ))}
      </main>
    </div>
  );
}
