import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// Gestion complète de la carte (§4.4) : catégories, produits, suppléments.

type Result = { error: string } | { ok: true };

function isUniqueConstraintError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

function isForeignKeyConstraintError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003";
}

// --- Catégories ---------------------------------------------------------

export async function createCategory(input: {
  name: string;
  position?: number;
}): Promise<{ error: string } | { categoryId: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Le nom de la catégorie est requis." };

  try {
    const category = await prisma.category.create({
      data: { name, position: input.position ?? 0 },
    });
    return { categoryId: category.id };
  } catch (e) {
    if (isUniqueConstraintError(e)) return { error: "Une catégorie porte déjà ce nom." };
    throw e;
  }
}

export async function updateCategory(
  id: string,
  input: { name?: string; position?: number },
): Promise<Result> {
  const data: { name?: string; position?: number } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { error: "Le nom de la catégorie est requis." };
    data.name = name;
  }
  if (input.position !== undefined) {
    if (!Number.isInteger(input.position)) return { error: "Position invalide." };
    data.position = input.position;
  }

  try {
    await prisma.category.update({ where: { id }, data });
    return { ok: true };
  } catch (e) {
    if (isUniqueConstraintError(e)) return { error: "Une catégorie porte déjà ce nom." };
    throw e;
  }
}

export async function deleteCategory(id: string): Promise<Result> {
  const productsCount = await prisma.product.count({ where: { categoryId: id } });
  if (productsCount > 0) {
    return { error: "Impossible de supprimer une catégorie qui contient encore des produits." };
  }

  await prisma.category.delete({ where: { id } });
  return { ok: true };
}

// --- Produits ------------------------------------------------------------

export type ProductInput = {
  name: string;
  description: string;
  priceCents: number;
  imageUrl?: string;
  allergens: string[];
};

function validateProductInput(input: Partial<ProductInput>): string | null {
  if (input.name !== undefined && !input.name.trim()) return "Le nom du produit est requis.";
  if (
    input.priceCents !== undefined &&
    (!Number.isInteger(input.priceCents) || input.priceCents < 0)
  ) {
    return "Le prix est invalide.";
  }
  return null;
}

export async function createProduct(
  categoryId: string,
  input: ProductInput,
): Promise<{ error: string } | { productId: string }> {
  const error = validateProductInput(input);
  if (error) return { error };

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return { error: "Catégorie introuvable." };

  const product = await prisma.product.create({
    data: {
      categoryId,
      name: input.name.trim(),
      description: input.description.trim(),
      priceCents: input.priceCents,
      imageUrl: input.imageUrl?.trim() || undefined,
      allergens: input.allergens,
    },
  });

  return { productId: product.id };
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput> & { categoryId?: string },
): Promise<Result> {
  const error = validateProductInput(input);
  if (error) return { error };

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) return { error: "Catégorie introuvable." };
  }

  await prisma.product.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      name: input.name?.trim(),
      description: input.description?.trim(),
      priceCents: input.priceCents,
      imageUrl: input.imageUrl !== undefined ? input.imageUrl.trim() || null : undefined,
      allergens: input.allergens,
    },
  });

  return { ok: true };
}

export async function setProductAvailability(id: string, available: boolean): Promise<Result> {
  await prisma.product.update({ where: { id }, data: { available } });
  return { ok: true };
}

// Un produit déjà commandé ne peut pas être supprimé (référencé par
// OrderItem, pas de cascade) — on renvoie une erreur explicite plutôt que de
// laisser remonter la contrainte de clé étrangère brute. Le rendre
// indisponible reste le mécanisme prévu par le cahier des charges (§4.4).
export async function deleteProduct(id: string): Promise<Result> {
  try {
    await prisma.product.delete({ where: { id } });
    return { ok: true };
  } catch (e) {
    if (isForeignKeyConstraintError(e)) {
      return {
        error: "Ce produit a déjà été commandé : marquez-le indisponible plutôt que de le supprimer.",
      };
    }
    throw e;
  }
}

// --- Suppléments -----------------------------------------------------------

export type SupplementInput = { name: string; priceCents: number };

export async function createSupplement(
  productId: string,
  input: SupplementInput,
): Promise<{ error: string } | { supplementId: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Le nom du supplément est requis." };
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
    return { error: "Le prix est invalide." };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Produit introuvable." };

  const supplement = await prisma.supplement.create({
    data: { productId, name, priceCents: input.priceCents },
  });

  return { supplementId: supplement.id };
}

export async function updateSupplement(
  id: string,
  input: Partial<SupplementInput>,
): Promise<Result> {
  if (input.name !== undefined && !input.name.trim()) {
    return { error: "Le nom du supplément est requis." };
  }
  if (
    input.priceCents !== undefined &&
    (!Number.isInteger(input.priceCents) || input.priceCents < 0)
  ) {
    return { error: "Le prix est invalide." };
  }

  await prisma.supplement.update({
    where: { id },
    data: { name: input.name?.trim(), priceCents: input.priceCents },
  });

  return { ok: true };
}

export async function setSupplementAvailability(id: string, available: boolean): Promise<Result> {
  await prisma.supplement.update({ where: { id }, data: { available } });
  return { ok: true };
}

export async function deleteSupplement(id: string): Promise<Result> {
  try {
    await prisma.supplement.delete({ where: { id } });
    return { ok: true };
  } catch (e) {
    if (isForeignKeyConstraintError(e)) {
      return {
        error:
          "Ce supplément a déjà été commandé : marquez-le indisponible plutôt que de le supprimer.",
      };
    }
    throw e;
  }
}
