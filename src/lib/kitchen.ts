import { prisma } from "@/lib/prisma";
import { assignNextLivreur } from "@/lib/delivery";

// Prise en charge par la cuisine (§5.1) : distincte de l'acceptation admin
// (src/lib/admin-orders.ts), cf. §5.2.
export async function takeOrder(orderId: string): Promise<{ error: string } | { ok: true }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Commande introuvable." };
  if (order.status !== "ACCEPTEE") {
    return { error: "Cette commande n'est pas encore acceptée." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "EN_PREPARATION", kitchenAcceptedAt: new Date() },
  });
  return { ok: true };
}

// Commande prête : si livraison, déclenche la proposition à un livreur
// (§6.1) ; si à emporter, elle attend le retrait du client en salle.
export async function markReady(orderId: string): Promise<{ error: string } | { ok: true }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Commande introuvable." };
  if (order.status !== "EN_PREPARATION") {
    return { error: "Cette commande n'est pas en cours de préparation." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PRETE", readyAt: new Date() },
  });

  if (order.mode === "LIVRAISON") {
    await assignNextLivreur(orderId);
  }
  return { ok: true };
}

// Retrait en salle par le client (§9.2) : clôture le cycle et crédite la
// fidélité (§7.1, §7.3), symétrique à markDelivered côté livraison.
export async function markRetrieved(orderId: string): Promise<{ error: string } | { ok: true }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Commande introuvable." };
  if (order.mode !== "EMPORTER") {
    return { error: "Cette commande n'est pas à emporter." };
  }
  if (order.status !== "PRETE") {
    return { error: "Cette commande n'est pas encore prête." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "RETIREE", deliveredAt: new Date() },
    }),
    prisma.user.update({
      where: { id: order.userId },
      data: { loyaltyCentsCumulated: { increment: order.totalCents } },
    }),
  ]);
  return { ok: true };
}
