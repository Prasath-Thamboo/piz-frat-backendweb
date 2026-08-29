"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-context";

export type ProductCardData = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  allergens: string[];
  supplements: { id: string; name: string; priceCents: number }[];
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [justAdded, setJustAdded] = useState(false);

  function toggleSupplement(id: string) {
    setSelectedSupplements((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function confirmAdd() {
    addItem({
      productId: product.id,
      productName: product.name,
      unitPriceCents: product.priceCents,
      supplements: product.supplements.filter((s) =>
        selectedSupplements.includes(s.id),
      ),
    });
    setSelectedSupplements([]);
    setExpanded(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  function handleAddClick() {
    if (product.supplements.length > 0) {
      setExpanded((prev) => !prev);
      return;
    }
    addItem({
      productId: product.id,
      productName: product.name,
      unitPriceCents: product.priceCents,
      supplements: [],
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{product.name}</h3>
          {product.description && (
            <p className="mt-0.5 text-sm text-neutral-500">
              {product.description}
            </p>
          )}
          {product.allergens.length > 0 && (
            <p className="mt-1 text-xs text-neutral-400">
              Allergènes : {product.allergens.join(", ")}
            </p>
          )}
        </div>
        <span className="whitespace-nowrap font-semibold text-red-800">
          {(product.priceCents / 100).toFixed(2)} €
        </span>
      </div>

      {expanded && product.supplements.length > 0 && (
        <div className="mt-3 space-y-2 rounded-lg bg-neutral-50 p-3">
          <p className="text-xs font-medium text-neutral-500">Suppléments</p>
          {product.supplements
            .filter((s) => s.priceCents >= 0)
            .map((supplement) => (
              <label
                key={supplement.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedSupplements.includes(supplement.id)}
                    onChange={() => toggleSupplement(supplement.id)}
                  />
                  {supplement.name}
                </span>
                <span className="text-neutral-500">
                  +{(supplement.priceCents / 100).toFixed(2)} €
                </span>
              </label>
            ))}
          <button
            type="button"
            onClick={confirmAdd}
            className="mt-1 w-full rounded-lg bg-red-800 py-2 text-sm font-medium text-white hover:bg-red-900"
          >
            Ajouter au panier
          </button>
        </div>
      )}

      {!expanded && (
        <button
          type="button"
          onClick={handleAddClick}
          className="mt-3 w-full rounded-lg border border-red-800 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
        >
          {justAdded
            ? "Ajouté ✓"
            : product.supplements.length > 0
              ? "Choisir les suppléments"
              : "Ajouter au panier"}
        </button>
      )}
    </article>
  );
}
