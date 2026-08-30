import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";
import { CategoryEditor } from "./category-editor";
import { NewCategoryForm } from "./new-category-form";

export default async function AdminCartePage() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: {
      products: {
        orderBy: { name: "asc" },
        include: { supplements: { orderBy: { name: "asc" } } },
      },
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Gestion de la carte" />
      <main className="flex-1 space-y-4 p-4">
        <NewCategoryForm />
        {categories.length === 0 && (
          <p className="text-sm text-neutral-500">Aucune catégorie pour l&apos;instant.</p>
        )}
        {categories.map((c) => (
          <CategoryEditor
            key={c.id}
            category={{
              id: c.id,
              name: c.name,
              position: c.position,
              products: c.products.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                priceCents: p.priceCents,
                imageUrl: p.imageUrl,
                allergens: p.allergens,
                available: p.available,
                supplements: p.supplements.map((s) => ({
                  id: s.id,
                  name: s.name,
                  priceCents: s.priceCents,
                  available: s.available,
                })),
              })),
            }}
          />
        ))}
      </main>
    </div>
  );
}
