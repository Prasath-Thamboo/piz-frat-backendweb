import { NextResponse } from "next/server";
import type { Role } from "@/generated/prisma/enums";
import { verifyMobileToken } from "@/lib/mobile-token";
import type { MobileTokenPayload } from "@/lib/mobile-token";

export { signMobileToken, verifyMobileToken } from "@/lib/mobile-token";
export type { MobileTokenPayload } from "@/lib/mobile-token";

export async function getMobileUser(
  req: Request,
): Promise<MobileTokenPayload | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifyMobileToken(header.slice("Bearer ".length));
}

// Garde d'accès partagée par les routes mobile réservées à un rôle
// (espaces cuisine/livreur, §4.12/§5.2/§10.2) : renvoie soit le payload
// authentifié, soit une réponse d'erreur déjà prête à retourner telle quelle.
export async function requireMobileRole(
  req: Request,
  role: Role,
): Promise<MobileTokenPayload | NextResponse> {
  const auth = await getMobileUser(req);
  if (!auth) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (auth.role !== role) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  return auth;
}
