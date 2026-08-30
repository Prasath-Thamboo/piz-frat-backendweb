"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import {
  createUserAccount,
  updateUserAccount,
  setUserDisabled,
  deleteUserAccount,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/users";

type ActionResult = { error: string } | { ok: true };

function revalidateUsers() {
  revalidatePath("/admin/utilisateurs");
}

export async function createUserAction(input: CreateUserInput) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await createUserAccount(input);
  if ("userId" in result) revalidateUsers();
  return result;
}

export async function updateUserAction(id: string, input: UpdateUserInput): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await updateUserAccount(id, input);
  if ("ok" in result) revalidateUsers();
  return result;
}

export async function setUserDisabledAction(id: string, disabled: boolean): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await setUserDisabled(id, disabled);
  if ("ok" in result) revalidateUsers();
  return result;
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await deleteUserAccount(id);
  if ("ok" in result) revalidateUsers();
  return result;
}
