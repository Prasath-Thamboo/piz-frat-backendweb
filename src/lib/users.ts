import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";

// Gestion des comptes clients/cuisiniers/livreurs par l'administrateur
// (§4.7, §4.10). Les comptes ADMIN ne sont pas gérables depuis cette UI —
// non prévu par le cahier des charges, et ça évite tout risque
// d'auto-désactivation ou d'auto-suppression du seul compte admin.
export type ManagedRole = Extract<Role, "CLIENT" | "CUISINIER" | "LIVREUR">;

function isUniqueConstraintError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

function isForeignKeyConstraintError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003";
}

function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email);
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: ManagedRole;
  phone?: string;
};

export async function createUserAccount(
  input: CreateUserInput,
): Promise<{ error: string } | { userId: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { error: "Le nom est requis." };
  if (!isValidEmail(email)) return { error: "Adresse e-mail invalide." };
  if (input.password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: input.role,
        phone: input.phone?.trim() || undefined,
      },
    });
    return { userId: user.id };
  } catch (e) {
    if (isUniqueConstraintError(e)) return { error: "Un compte existe déjà avec cet e-mail." };
    throw e;
  }
}

export type UpdateUserInput = {
  name?: string;
  email?: string;
  phone?: string;
  role?: ManagedRole;
  password?: string;
};

async function requireManagedUser(id: string): Promise<{ error: string } | null> {
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return { error: "Utilisateur introuvable." };
  if (target.role === "ADMIN") {
    return { error: "Ce compte n'est pas gérable depuis cet écran." };
  }
  return null;
}

export async function updateUserAccount(
  id: string,
  input: UpdateUserInput,
): Promise<{ error: string } | { ok: true }> {
  const denied = await requireManagedUser(id);
  if (denied) return denied;

  const data: Prisma.UserUpdateInput = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { error: "Le nom est requis." };
    data.name = name;
  }
  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!isValidEmail(email)) return { error: "Adresse e-mail invalide." };
    data.email = email;
  }
  if (input.phone !== undefined) {
    data.phone = input.phone.trim() || null;
  }
  if (input.role !== undefined) {
    data.role = input.role;
  }
  if (input.password !== undefined && input.password !== "") {
    if (input.password.length < 6) {
      return { error: "Le mot de passe doit contenir au moins 6 caractères." };
    }
    data.passwordHash = await bcrypt.hash(input.password, 10);
  }

  try {
    await prisma.user.update({ where: { id }, data });
    return { ok: true };
  } catch (e) {
    if (isUniqueConstraintError(e)) return { error: "Un compte existe déjà avec cet e-mail." };
    throw e;
  }
}

export async function setUserDisabled(
  id: string,
  disabled: boolean,
): Promise<{ error: string } | { ok: true }> {
  const denied = await requireManagedUser(id);
  if (denied) return denied;

  await prisma.user.update({ where: { id }, data: { disabled } });
  return { ok: true };
}

// "Suppression des comptes livreurs" (§4.7) — étendue ici aux trois rôles
// gérables par cohérence avec §4.10. Un compte ayant déjà de l'activité
// (commandes, réservations, avis, livraisons...) ne peut pas être supprimé
// (contraintes de clé étrangère sans cascade) : la désactivation reste le
// mécanisme prévu dans ce cas, comme pour les produits (src/lib/menu.ts).
export async function deleteUserAccount(id: string): Promise<{ error: string } | { ok: true }> {
  const denied = await requireManagedUser(id);
  if (denied) return denied;

  try {
    await prisma.user.delete({ where: { id } });
    return { ok: true };
  } catch (e) {
    if (isForeignKeyConstraintError(e)) {
      return {
        error: "Ce compte a déjà de l'activité enregistrée : désactivez-le plutôt que de le supprimer.",
      };
    }
    throw e;
  }
}
