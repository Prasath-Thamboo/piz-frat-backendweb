import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";
import { CashbackThresholdForm } from "./cashback-threshold-form";
import { NewPromotionForm } from "./new-promotion-form";
import { PromotionItem } from "./promotion-item";

function computeStatus(startAt: Date, endAt: Date): "à venir" | "active" | "terminée" {
  const now = new Date();
  if (now < startAt) return "à venir";
  if (now > endAt) return "terminée";
  return "active";
}

export default async function AdminPromotionsPage() {
  const [settings, promotions, clients] = await Promise.all([
    prisma.restaurantSettings.findUnique({ where: { id: "settings" } }),
    prisma.promotion.findMany({
      orderBy: { startAt: "desc" },
      include: { targets: true },
    }),
    prisma.user.findMany({ where: { role: "CLIENT" }, orderBy: { name: "asc" } }),
  ]);

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name, email: c.email }));

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Promotions et fidélité" />
      <main className="flex-1 space-y-6 p-4">
        <CashbackThresholdForm currentCents={settings?.cashbackThresholdCents ?? 10000} />

        <NewPromotionForm clients={clientOptions} />

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Promotions</h2>
          {promotions.length === 0 && (
            <p className="text-sm text-neutral-500">Aucune promotion pour l&apos;instant.</p>
          )}
          {promotions.map((p) => (
            <PromotionItem
              key={p.id}
              clients={clientOptions}
              promotion={{
                id: p.id,
                title: p.title,
                description: p.description,
                audience: p.audience,
                startAt: p.startAt.toISOString(),
                endAt: p.endAt.toISOString(),
                targetUserIds: p.targets.map((t) => t.userId),
                status: computeStatus(p.startAt, p.endAt),
              }}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
