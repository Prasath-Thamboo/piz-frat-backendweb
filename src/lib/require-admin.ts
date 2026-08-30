import { auth } from "@/auth";

// Garde d'accès partagée par toutes les server actions de l'espace admin
// (cloisonnement strict §10.2 — l'admin seul peut agir ici).
export async function requireAdmin(): Promise<{ error: string } | null> {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return { error: "Non autorisé." };
  return null;
}
