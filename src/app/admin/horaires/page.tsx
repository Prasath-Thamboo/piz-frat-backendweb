import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";
import { ServiceSettingsForm } from "./service-settings-form";

const ACTIVE_STATUSES = [
  "EN_ATTENTE",
  "ACCEPTEE",
  "EN_PREPARATION",
  "PRETE",
  "EN_LIVRAISON",
] as const;

export default async function AdminHorairesPage() {
  const [settings, activeOrdersCount] = await Promise.all([
    prisma.restaurantSettings.findUnique({ where: { id: "settings" } }),
    prisma.order.count({ where: { status: { in: [...ACTIVE_STATUSES] } } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Délais et prise de commande" />
      <main className="flex-1 p-4">
        <ServiceSettingsForm
          orderingOpen={settings?.orderingOpen ?? true}
          currentExtraDelayMinutes={settings?.currentExtraDelayMinutes ?? 0}
          activeOrdersCount={activeOrdersCount}
        />
      </main>
    </div>
  );
}
