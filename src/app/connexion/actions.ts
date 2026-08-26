"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
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
