"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  setProductAvailability,
  deleteProduct,
  createSupplement,
  updateSupplement,
  setSupplementAvailability,
  deleteSupplement,
  type ProductInput,
  type SupplementInput,
} from "@/lib/menu";

type ActionResult = { error: string } | { ok: true };

function revalidateMenu() {
  revalidatePath("/admin/carte");
  revalidatePath("/");
}

export async function createCategoryAction(input: { name: string; position?: number }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await createCategory(input);
  if ("categoryId" in result) revalidateMenu();
  return result;
}

export async function updateCategoryAction(
  id: string,
  input: { name?: string; position?: number },
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await updateCategory(id, input);
  if ("ok" in result) revalidateMenu();
  return result;
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await deleteCategory(id);
  if ("ok" in result) revalidateMenu();
  return result;
}

export async function createProductAction(categoryId: string, input: ProductInput) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await createProduct(categoryId, input);
  if ("productId" in result) revalidateMenu();
  return result;
}

export async function updateProductAction(
  id: string,
  input: Partial<ProductInput> & { categoryId?: string },
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await updateProduct(id, input);
  if ("ok" in result) revalidateMenu();
  return result;
}

export async function setProductAvailabilityAction(
  id: string,
  available: boolean,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await setProductAvailability(id, available);
  if ("ok" in result) revalidateMenu();
  return result;
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await deleteProduct(id);
  if ("ok" in result) revalidateMenu();
  return result;
}

export async function createSupplementAction(productId: string, input: SupplementInput) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await createSupplement(productId, input);
  if ("supplementId" in result) revalidateMenu();
  return result;
}

export async function updateSupplementAction(
  id: string,
  input: Partial<SupplementInput>,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await updateSupplement(id, input);
  if ("ok" in result) revalidateMenu();
  return result;
}

export async function setSupplementAvailabilityAction(
  id: string,
  available: boolean,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await setSupplementAvailability(id, available);
  if ("ok" in result) revalidateMenu();
  return result;
}

export async function deleteSupplementAction(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await deleteSupplement(id);
  if ("ok" in result) revalidateMenu();
  return result;
}
