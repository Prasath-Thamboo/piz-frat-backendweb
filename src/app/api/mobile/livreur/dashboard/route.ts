import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileRole } from "@/lib/mobile-auth";
import { expireStaleProposalsAndReassign } from "@/lib/delivery";

export async function GET(req: Request) {
  const auth = await requireMobileRole(req, "LIVREUR");
  if (auth instanceof NextResponse) return auth;

  // Réattribution paresseuse des propositions expirées (§6.1, §7.2) — comme
  // pour la page web /livreur, vérifiée à chaque consultation du tableau de bord.
  await expireStaleProposalsAndReassign();

  const [proposals, activeDeliveries] = await Promise.all([
    prisma.deliveryProposal.findMany({
      where: { livreurId: auth.sub, status: "PROPOSEE" },
      include: { order: { include: { address: true } } },
      orderBy: { proposedAt: "asc" },
    }),
    prisma.deliveryProposal.findMany({
      where: { livreurId: auth.sub, status: "ACCEPTEE", order: { status: "EN_LIVRAISON" } },
      include: { order: { include: { address: true } } },
      orderBy: { respondedAt: "asc" },
    }),
  ]);

  return NextResponse.json({ proposals, activeDeliveries });
}
