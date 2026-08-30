import { prisma } from "@/lib/prisma";
import { notifyRole, notifyUser } from "@/lib/realtime";

// Étape d'acceptation par l'administrateur (§4.1, §7.1). Elle précède et
// reste distincte de la prise en charge par la cuisine (§5.1) : le champ
// acceptedAt (ici) et kitchenAcceptedAt (src/lib/kitchen.ts) sont deux
// horodatages séparés dans le schéma, cf. §5.2 — point à confirmer avec le
// client sur la fusion éventuelle des deux étapes.
export async function acceptOrder(orderId: string): Promise<{ error: string } | { ok: true }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Commande introuvable." };
  if (order.status !== "EN_ATTENTE") {
    return { error: "Cette commande n'est plus en attente." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "ACCEPTEE", acceptedAt: new Date() },
  });

  notifyUser(order.userId, "Votre commande a été acceptée par le restaurant.");
  notifyRole("CUISINIER", "Une nouvelle commande est prête à être préparée.");

  return { ok: true };
}

export async function refuseOrder(orderId: string): Promise<{ error: string } | { ok: true }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Commande introuvable." };
  if (order.status !== "EN_ATTENTE") {
    return { error: "Cette commande n'est plus en attente." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "REFUSEE" },
  });

  notifyUser(order.userId, "Votre commande a été refusée par le restaurant.");

  return { ok: true };
}
