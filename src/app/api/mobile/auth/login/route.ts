import { NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth-credentials";
import { signMobileToken } from "@/lib/mobile-auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  const password = body?.password as string | undefined;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 },
    );
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json(
      { error: "Identifiants incorrects." },
      { status: 401 },
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
