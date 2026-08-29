import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({
      orderBy: { position: "asc" },
      include: {
        products: {
          where: { available: true },
          orderBy: { name: "asc" },
          include: {
            supplements: { where: { available: true }, orderBy: { name: "asc" } },
          },
        },
      },
    }),
    prisma.restaurantSettings.findUnique({ where: { id: "settings" } }),
  ]);

  return NextResponse.json({
    categories,
    orderingOpen: settings?.orderingOpen ?? true,
    deliveryPostalCodes: settings?.deliveryPostalCodes ?? [],
  });
}
