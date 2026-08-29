import { encode, decode } from "@auth/core/jwt";
import type { Role } from "@/generated/prisma/enums";

// Jeton mobile indépendant du cookie de session web (NextAuth) : même
// AUTH_SECRET, mais un salt dédié pour ne pas dépendre du nom interne du
// cookie NextAuth (qui varie selon l'environnement).
const SALT = "pizza-fratelli-mobile";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

export type MobileTokenPayload = {
  sub: string;
  role: Role;
  name: string;
  email: string;
};

function requireSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant.");
  return secret;
}

export async function signMobileToken(user: MobileTokenPayload): Promise<string> {
  return encode({
    secret: requireSecret(),
    salt: SALT,
    maxAge: MAX_AGE_SECONDS,
    token: user,
  });
}

export async function verifyMobileToken(
  token: string,
): Promise<MobileTokenPayload | null> {
  try {
    const payload = await decode<MobileTokenPayload>({
      secret: requireSecret(),
      salt: SALT,
      token,
    });
    return payload?.sub ? payload : null;
  } catch {
    return null;
  }
}

export async function getMobileUser(
  req: Request,
): Promise<MobileTokenPayload | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifyMobileToken(header.slice("Bearer ".length));
}
