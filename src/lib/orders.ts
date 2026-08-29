import { prisma } from "@/lib/prisma";
import type { Address } from "@/generated/prisma/client";

// Logique métier partagée entre les server actions web (src/app/panier,
// src/app/commandes) et l'API mobile (src/app/api/mobile) : une seule
// implémentation des règles de validation et de calcul de prix.

// Délai de base annoncé au client à la validation (§3.2). L'administrateur
// peut ensuite l'allonger via extraDelayMinutes en cas d'affluence (§4.2).
const BASE_ESTIMATED_MINUTES: Record<"LIVRAISON" | "EMPORTER", number> = {
  LIVRAISON: 45,
  EMPORTER: 20,
};

export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
  supplementIds: string[];
};

export type CreateOrderInput = {
  mode: "LIVRAISON" | "EMPORTER";
  addressId?: string;
  items: CreateOrderItemInput[];
};

export type CreateOrderResult = { error: string } | { orderId: string };

type CreateOrderItemData = {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  supplements: { create: { supplementId: string; priceCents: number }[] };
};

export async function createOrderForUser(
  userId: string,
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  if (input.items.length === 0) {
    return { error: "Votre panier est vide." };
  }

  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: "settings" },
  });
  if (!settings || !settings.orderingOpen) {
    return { error: "La prise de commande est fermée pour le moment." };
  }

  let addressId: string | undefined;
  if (input.mode === "LIVRAISON") {
    if (!input.addressId) {
      return { error: "Choisissez une adresse de livraison." };
    }
    const address = await prisma.address.findFirst({
      where: { id: input.addressId, userId },
    });
    if (!address) {
      return { error: "Adresse de livraison invalide." };
    }
    if (
      settings.deliveryPostalCodes.length > 0 &&
      !settings.deliveryPostalCodes.includes(address.postalCode)
    ) {
      return { error: "Cette adresse est hors de notre zone de livraison." };
    }
    addressId = address.id;
  }

  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { supplements: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  let totalCents = 0;
  const itemsData: CreateOrderItemData[] = [];

  for (const line of input.items) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return { error: "Quantité invalide." };
    }
    const product = productById.get(line.productId);
    if (!product || !product.available) {
      return {
        error: `Un produit de votre panier n'est plus disponible : ${product?.name ?? line.productId}.`,
      };
    }

    const chosenSupplements = product.supplements.filter(
      (s) => line.supplementIds.includes(s.id) && s.available,
    );
    const unitExtraCents = chosenSupplements.reduce((sum, s) => sum + s.priceCents, 0);
    totalCents += (product.priceCents + unitExtraCents) * line.quantity;

    itemsData.push({
      productId: product.id,
      quantity: line.quantity,
      unitPriceCents: product.priceCents,
      supplements: {
        create: chosenSupplements.map((s) => ({
          supplementId: s.id,
          priceCents: s.priceCents,
        })),
      },
    });
  }

  const order = await prisma.order.create({
    data: {
      userId,
      mode: input.mode,
      addressId,
      totalCents,
      estimatedMinutes: BASE_ESTIMATED_MINUTES[input.mode],
      items: { create: itemsData },
    },
  });

  return { orderId: order.id };
}

export async function addAddressForUser(
  userId: string,
  fields: { label: string; line1: string; postalCode: string; city: string },
): Promise<{ error: string } | { address: Address }> {
  const label = fields.label.trim();
  const line1 = fields.line1.trim();
  const postalCode = fields.postalCode.trim();
  const city = fields.city.trim();

  if (!label || !line1 || !postalCode || !city) {
    return { error: "Tous les champs de l'adresse sont requis." };
  }

  const address = await prisma.address.create({
    data: { userId, label, line1, postalCode, city },
  });

  return { address };
}

// Fenêtre d'annulation : tant que la commande n'a pas été acceptée par
// l'administrateur (§3.2 — point à valider avec le client sur la frontière
// exacte ; on retient ici le statut EN_ATTENTE comme borne la plus sûre).
export async function cancelOrderForUser(
  userId: string,
  orderId: string,
): Promise<{ error: string } | { ok: true }> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });
  if (!order) return { error: "Commande introuvable." };
  if (order.status !== "EN_ATTENTE") {
    return { error: "Cette commande ne peut plus être annulée." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "ANNULEE", cancelledAt: new Date() },
  });

  return { ok: true };
}
