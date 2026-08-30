import { prisma } from "@/lib/prisma";
import type { PromotionAudience } from "@/generated/prisma/enums";

// Gestion des promotions (§4.3, §7.4) et seuil de cashback fidélité (§3.4),
// regroupés ici car le cahier des charges les traite dans la même section.

export type PromotionInput = {
  title: string;
  description: string;
  audience: PromotionAudience;
  startAt: string;
  endAt: string;
  targetUserIds?: string[];
};

function validatePromotionInput(input: PromotionInput): string | null {
  if (!input.title.trim()) return "Le titre est requis.";
  if (!input.description.trim()) return "La description est requise.";

  const start = new Date(input.startAt);
  const end = new Date(input.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Dates invalides.";
  if (end <= start) return "La date de fin doit être après la date de début.";

  if (input.audience === "CIBLEE" && (!input.targetUserIds || input.targetUserIds.length === 0)) {
    return "Sélectionnez au moins un client pour une promotion ciblée.";
  }

  return null;
}

export async function createPromotion(
  input: PromotionInput,
): Promise<{ error: string } | { promotionId: string }> {
  const error = validatePromotionInput(input);
  if (error) return { error };

  const targetUserIds = input.audience === "CIBLEE" ? (input.targetUserIds ?? []) : [];

  const promotion = await prisma.promotion.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      audience: input.audience,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      targets: { create: targetUserIds.map((userId) => ({ userId })) },
    },
  });

  return { promotionId: promotion.id };
}

export async function updatePromotion(
  id: string,
  input: PromotionInput,
): Promise<{ error: string } | { ok: true }> {
  const error = validatePromotionInput(input);
  if (error) return { error };

  const promotion = await prisma.promotion.findUnique({ where: { id } });
  if (!promotion) return { error: "Promotion introuvable." };

  const targetUserIds = input.audience === "CIBLEE" ? (input.targetUserIds ?? []) : [];

  await prisma.$transaction([
    prisma.promotion.update({
      where: { id },
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        audience: input.audience,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
      },
    }),
    prisma.promotionTarget.deleteMany({ where: { promotionId: id } }),
    ...(targetUserIds.length > 0
      ? [
          prisma.promotionTarget.createMany({
            data: targetUserIds.map((userId) => ({ promotionId: id, userId })),
          }),
        ]
      : []),
  ]);

  return { ok: true };
}

export async function deletePromotion(id: string): Promise<{ error: string } | { ok: true }> {
  const promotion = await prisma.promotion.findUnique({ where: { id } });
  if (!promotion) return { error: "Promotion introuvable." };

  await prisma.promotion.delete({ where: { id } });
  return { ok: true };
}

export async function setCashbackThreshold(
  cents: number,
): Promise<{ error: string } | { ok: true }> {
  if (!Number.isInteger(cents) || cents <= 0) {
    return { error: "Le seuil doit être un montant positif." };
  }

  await prisma.restaurantSettings.update({
    where: { id: "settings" },
    data: { cashbackThresholdCents: cents },
  });

  return { ok: true };
}
