import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CartView } from "./cart-view";

export default async function PanierPage() {
  const session = await auth();
  if (!session) redirect("/connexion?callbackUrl=/panier");

  const [addresses, settings] = await Promise.all([
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
    }),
    prisma.restaurantSettings.findUnique({ where: { id: "settings" } }),
  ]);

  return (
    <CartView
      addresses={addresses}
      orderingOpen={settings?.orderingOpen ?? true}
      deliveryPostalCodes={settings?.deliveryPostalCodes ?? []}
    />
  );
}
