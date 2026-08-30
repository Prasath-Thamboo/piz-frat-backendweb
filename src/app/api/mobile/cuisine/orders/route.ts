import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(req: Request) {
  const auth = await requireMobileRole(req, "CUISINIER");
  if (auth instanceof NextResponse) return auth;

  const orders = await prisma.order.findMany({
    where: { status: { in: ["ACCEPTEE", "EN_PREPARATION", "PRETE"] } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ orders });
}
