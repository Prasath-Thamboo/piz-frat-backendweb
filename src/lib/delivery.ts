import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/realtime";

// Délai de réponse laissé à un livreur avant réattribution automatique
// (§6.1, §7.2). Aucune valeur n'est fixée par le cahier des charges ;
// 2 minutes est une valeur de travail à ajuster avec le client.
const PROPOSAL_TTL_MINUTES = 2;

// Propose la commande au livreur disponible le moins chargé, en excluant
// ceux à qui elle a déjà été proposée pour éviter de la leur reproposer
// après un refus ou une expiration (§6.1).
export async function assignNextLivreur(orderId: string): Promise<void> {
  const [alreadyTried, livreurs] = await Promise.all([
    prisma.deliveryProposal.findMany({
      where: { orderId },
      select: { livreurId: true },
    }),
    prisma.user.findMany({
      where: { role: "LIVREUR", disabled: false },
      select: {
        id: true,
        _count: { select: { deliveryProposals: { where: { status: "PROPOSEE" } } } },
      },
    }),
  ]);

  const triedIds = new Set(alreadyTried.map((p) => p.livreurId));
  const candidates = livreurs
    .filter((l) => !triedIds.has(l.id))
    .sort((a, b) => a._count.deliveryProposals - b._count.deliveryProposals);

  const chosen = candidates[0];
  if (!chosen) return; // Aucun livreur disponible — la commande reste PRETE sans proposition active.

  await prisma.deliveryProposal.create({
    data: {
      orderId,
      livreurId: chosen.id,
      expiresAt: new Date(Date.now() + PROPOSAL_TTL_MINUTES * 60 * 1000),
    },
  });

  notifyUser(chosen.id, "Nouvelle proposition de livraison.");
}

// Vérification paresseuse des propositions expirées : à défaut de tâche de
// fond, on la déclenche à chaque consultation de l'espace livreur.
export async function expireStaleProposalsAndReassign(): Promise<void> {
  const stale = await prisma.deliveryProposal.findMany({
    where: { status: "PROPOSEE", expiresAt: { lt: new Date() } },
    select: { id: true, orderId: true },
  });
  if (stale.length === 0) return;

  await prisma.deliveryProposal.updateMany({
    where: { id: { in: stale.map((p) => p.id) } },
    data: { status: "EXPIREE", respondedAt: new Date() },
  });

  for (const proposal of stale) {
    await assignNextLivreur(proposal.orderId);
  }
}

export async function acceptProposal(
  livreurId: string,
  proposalId: string,
): Promise<{ error: string } | { ok: true }> {
  const proposal = await prisma.deliveryProposal.findFirst({
    where: { id: proposalId, livreurId },
  });
  if (!proposal) return { error: "Proposition introuvable." };
  if (proposal.status !== "PROPOSEE") {
    return { error: "Cette proposition n'est plus disponible." };
  }
  if (proposal.expiresAt < new Date()) {
    await prisma.deliveryProposal.update({
      where: { id: proposalId },
      data: { status: "EXPIREE", respondedAt: new Date() },
    });
    await assignNextLivreur(proposal.orderId);
    return { error: "Le délai de réponse est dépassé, la commande a été réattribuée." };
  }

  const [, order] = await prisma.$transaction([
    prisma.deliveryProposal.update({
      where: { id: proposalId },
      data: { status: "ACCEPTEE", respondedAt: new Date() },
    }),
    prisma.order.update({
      where: { id: proposal.orderId },
      data: { status: "EN_LIVRAISON" },
    }),
  ]);

  notifyUser(order.userId, "Votre commande est en cours de livraison.");

  return { ok: true };
}

export async function refuseProposal(
  livreurId: string,
  proposalId: string,
): Promise<{ error: string } | { ok: true }> {
  const proposal = await prisma.deliveryProposal.findFirst({
    where: { id: proposalId, livreurId },
  });
  if (!proposal) return { error: "Proposition introuvable." };
  if (proposal.status !== "PROPOSEE") {
    return { error: "Cette proposition n'est plus disponible." };
  }

  await prisma.deliveryProposal.update({
    where: { id: proposalId },
    data: { status: "REFUSEE", respondedAt: new Date() },
  });
  await assignNextLivreur(proposal.orderId);
  return { ok: true };
}

// Livraison effectuée : clôture du cycle et crédit fidélité (§7.1, §7.3).
export async function markDelivered(
  livreurId: string,
  orderId: string,
): Promise<{ error: string } | { ok: true }> {
  const proposal = await prisma.deliveryProposal.findFirst({
    where: { orderId, livreurId, status: "ACCEPTEE" },
  });
  if (!proposal) return { error: "Cette commande ne vous est pas assignée." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "EN_LIVRAISON") {
    return { error: "Cette commande n'est plus en cours de livraison." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "LIVREE", deliveredAt: new Date() },
    }),
    prisma.user.update({
      where: { id: order.userId },
      data: { loyaltyCentsCumulated: { increment: order.totalCents } },
    }),
  ]);

  notifyUser(order.userId, "Votre commande a été livrée. Bon appétit !");

  return { ok: true };
}
