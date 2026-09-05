import { NextResponse } from "next/server";
import { createUserAccount } from "@/lib/users";
import { verifyCredentials } from "@/lib/auth-credentials";
import { signMobileToken } from "@/lib/mobile-auth";

// Auto-inscription client (§3.1) depuis l'app mobile — même contrôle et même
// hachage que côté web (src/app/connexion/actions.ts) via createUserAccount,
// toujours en rôle CLIENT ; CUISINIER/LIVREUR restent réservés à
// /admin/utilisateurs.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = body?.name as string | undefined;
  const email = body?.email as string | undefined;
  const password = body?.password as string | undefined;
  const phone = body?.phone as string | undefined;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Nom, email et mot de passe requis." },
      { status: 400 },
    );
  }

  const result = await createUserAccount({ name, email, password, phone, role: "CLIENT" });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json(
      { error: "Compte créé, connexion impossible." },
      { status: 500 },
    );
  }

  const token = await signMobileToken({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  return NextResponse.json({ token, user });
}
