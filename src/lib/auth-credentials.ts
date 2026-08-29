import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// Utilisé par le provider Credentials (web) et par la connexion mobile
// (src/app/api/mobile/auth/login) pour éviter deux implémentations du
// même contrôle email/mot de passe.
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.disabled) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
