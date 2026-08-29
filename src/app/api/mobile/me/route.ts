import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";

export async function GET(req: Request) {
  const auth = await getMobileUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      loyaltyCentsCumulated: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  return NextResponse.json(user);
}
