import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { CartBadge } from "@/components/cart-badge";

export default async function Home() {
  const session = await auth();
  const categories = await prisma.category.findMany({
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
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            Pizza Fratelli
          </p>
          <h1 className="text-xl font-semibold text-red-800">Notre carte</h1>
        </div>
        <div className="flex items-center gap-2">
          <CartBadge />
          <Link
            href={session ? "/compte" : "/connexion"}
            className="rounded-lg border border-red-800 px-3 py-1.5 text-sm font-medium text-red-800"
          >
            {session ? "Mon compte" : "Connexion"}
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-8 px-4 pb-24">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="mb-3 text-lg font-semibold">{category.name}</h2>
            <div className="space-y-3">
              {category.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
