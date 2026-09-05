"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { createUserAccount } from "@/lib/users";
import type { Role } from "@/generated/prisma/enums";

const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  CUISINIER: "/cuisine",
  LIVREUR: "/livreur",
  CLIENT: "/compte",
};

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Identifiants incorrects." };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const destination = user ? ROLE_HOME[user.role] : "/compte";

  return { redirectTo: destination };
}

// Auto-inscription client (§3.1) : un compte créé ici est toujours CLIENT —
// les rôles CUISINIER/LIVREUR restent réservés à la création par un admin
// (/admin/utilisateurs), qui reste la seule voie pour ces rôles.
export async function registerAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) ?? "";
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const result = await createUserAccount({
    name,
    email,
    password,
    phone: phone || undefined,
    role: "CLIENT",
  });
  if ("error" in result) return { error: result.error };

  try {
    await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Ne devrait pas arriver : le compte vient d'être créé avec ce mot de
      // passe. En cas d'échec malgré tout, on renvoie vers le formulaire de
      // connexion plutôt que de bloquer l'utilisateur.
      return { error: "Compte créé. Merci de vous connecter." };
    }
    throw error;
  }

  return { redirectTo: "/compte" };
}
