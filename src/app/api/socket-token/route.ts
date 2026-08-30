import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { signMobileToken } from "@/lib/mobile-auth";

// Jeton court terme pour authentifier la connexion Socket.IO du web (qui n'a
// que le cookie de session NextAuth, pas de Bearer token) — réutilise le même
// format/vérification que le token mobile (src/lib/mobile-auth.ts) pour que
// le serveur Socket.IO n'ait qu'un seul mécanisme de vérification à gérer.
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const token = await signMobileToken({
    sub: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
  });

  return NextResponse.json({ token });
}
