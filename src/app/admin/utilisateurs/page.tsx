import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";
import { NewUserForm } from "./new-user-form";
import { UserEditor } from "./user-editor";
import type { ManagedRole } from "@/lib/users";

export default async function AdminUtilisateursPage() {
  const [cuisiniers, livreurs, clients] = await Promise.all([
    prisma.user.findMany({ where: { role: "CUISINIER" }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "LIVREUR" },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            deliveryProposals: {
              where: { status: "ACCEPTEE", order: { status: "EN_LIVRAISON" } },
            },
          },
        },
      },
    }),
    prisma.user.findMany({ where: { role: "CLIENT" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Utilisateurs" />
      <main className="flex-1 space-y-6 p-4">
        <NewUserForm />

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">Livreurs</h2>
          {livreurs.length === 0 && <p className="text-sm text-neutral-500">Aucun livreur.</p>}
          {livreurs.map((u) => (
            <UserEditor
              key={u.id}
              user={{
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                role: u.role as ManagedRole,
                disabled: u.disabled,
              }}
              activeDeliveries={u._count.deliveryProposals}
            />
          ))}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">Cuisiniers</h2>
          {cuisiniers.length === 0 && <p className="text-sm text-neutral-500">Aucun cuisinier.</p>}
          {cuisiniers.map((u) => (
            <UserEditor
              key={u.id}
              user={{
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                role: u.role as ManagedRole,
                disabled: u.disabled,
              }}
            />
          ))}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">Clients</h2>
          {clients.length === 0 && <p className="text-sm text-neutral-500">Aucun client.</p>}
          {clients.map((u) => (
            <UserEditor
              key={u.id}
              user={{
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                role: u.role as ManagedRole,
                disabled: u.disabled,
              }}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
