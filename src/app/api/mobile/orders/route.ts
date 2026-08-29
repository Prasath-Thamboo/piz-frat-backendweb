import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";
import { createOrderForUser, type CreateOrderInput } from "@/lib/orders";

export async function GET(req: Request) {
  const auth = await getMobileUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: auth.sub },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const auth = await getMobileUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const input = (await req.json().catch(() => null)) as CreateOrderInput | null;
  if (!input || !Array.isArray(input.items)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const result = await createOrderForUser(auth.sub, input);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result, { status: 201 });
}
