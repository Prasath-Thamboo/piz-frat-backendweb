import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/mobile/orders/[id]">,
) {
  const auth = await getMobileUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const order = await prisma.order.findFirst({
    where: { id, userId: auth.sub },
    include: {
      address: true,
      items: {
        include: { product: true, supplements: { include: { supplement: true } } },
      },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
