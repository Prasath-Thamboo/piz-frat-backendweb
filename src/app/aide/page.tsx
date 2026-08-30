import { redirect } from "next/navigation";
import { SpaceHeader } from "@/components/space-header";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AideView } from "./aide-view";

export default async function AidePage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const [feedbacks, orders] = await Promise.all([
    prisma.feedback.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Aide" />
      <main className="flex-1 p-4">
        <AideView
          orders={orders.map((o) => ({
            id: o.id,
            mode: o.mode,
            createdAt: o.createdAt.toISOString(),
          }))}
          feedbacks={feedbacks.map((f) => ({
            id: f.id,
            message: f.message,
            status: f.status,
            resolution: f.resolution,
            refundCents: f.refundCents,
            orderId: f.orderId,
            createdAt: f.createdAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
