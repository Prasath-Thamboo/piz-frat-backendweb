import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/enums";

// Fermeture temporaire de la prise de commande (§4.5) et délai
// supplémentaire en cas de forte affluence (§4.2).

// Statuts d'une commande encore "en cours" : celles concernées par un
// allongement de délai. Les statuts terminaux (livrée/retirée/annulée/
// refusée/clôturée) ne sont plus affectés par un rallongement de délai.
const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "EN_ATTENTE",
  "ACCEPTEE",
  "EN_PREPARATION",
  "PRETE",
  "EN_LIVRAISON",
];

export async function setOrderingOpen(open: boolean): Promise<{ ok: true }> {
  await prisma.restaurantSettings.update({
    where: { id: "settings" },
    data: { orderingOpen: open },
  });
  return { ok: true };
}

// Répercute le délai sur les commandes en cours (§4.2) et le conserve comme
// valeur courante pour les commandes à venir, via
// RestaurantSettings.currentExtraDelayMinutes lu à la création (src/lib/orders.ts).
export async function setExtraDelay(minutes: number): Promise<{ error: string } | { ok: true }> {
  if (!Number.isInteger(minutes) || minutes < 0) {
    return { error: "Le délai doit être un nombre de minutes positif." };
  }

  await prisma.$transaction([
    prisma.restaurantSettings.update({
      where: { id: "settings" },
      data: { currentExtraDelayMinutes: minutes },
    }),
    prisma.order.updateMany({
      where: { status: { in: ACTIVE_ORDER_STATUSES } },
      data: { extraDelayMinutes: minutes },
    }),
  ]);

  return { ok: true };
}
