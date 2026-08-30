"use client";

import { useState, useTransition } from "react";
import { updateCategoryAction, deleteCategoryAction, createProductAction } from "./actions";
import { ProductEditor } from "./product-editor";

type SupplementData = { id: string; name: string; priceCents: number; available: boolean };
type ProductData = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  allergens: string[];
  available: boolean;
  supplements: SupplementData[];
};
type CategoryData = { id: string; name: string; position: number; products: ProductData[] };

export function CategoryEditor({ category }: { category: CategoryData }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [position, setPosition] = useState(category.position);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    allergens: "",
  });
  const [newProductError, setNewProductError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateCategoryAction(category.id, { name, position });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if ("error" in result) setError(result.error);
    });
  }

  function handleAddProduct() {
    setNewProductError(null);
    const priceCents = Math.round(Number(newProduct.price) * 100);
    if (!newProduct.name.trim()) {
      setNewProductError("Nom requis.");
      return;
    }
    if (Number.isNaN(priceCents) || priceCents < 0) {
      setNewProductError("Prix invalide.");
      return;
    }
    startTransition(async () => {
      const result = await createProductAction(category.id, {
        name: newProduct.name,
        description: newProduct.description,
        priceCents,
        allergens: newProduct.allergens
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      });
      if ("error" in result) {
        setNewProductError(result.error);
        return;
      }
      setNewProduct({ name: "", description: "", price: "", allergens: "" });
      setAddingProduct(false);
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      {editing ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Nom</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Position</span>
            <input
              type="number"
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="w-20 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="rounded-lg bg-red-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
          >
            Annuler
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{category.name}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
            >
              Modifier
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={handleDelete}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-60"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-700">{error}</p>}

      <div className="space-y-3 pl-2">
        {category.products.map((p) => (
          <ProductEditor key={p.id} product={p} />
        ))}
      </div>

      {addingProduct ? (
        <div className="space-y-2 rounded-lg bg-neutral-50 p-3">
          <input
            value={newProduct.name}
            onChange={(e) => setNewProduct((s) => ({ ...s, name: e.target.value }))}
            placeholder="Nom du produit"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <textarea
            value={newProduct.description}
            onChange={(e) => setNewProduct((s) => ({ ...s, description: e.target.value }))}
            placeholder="Description"
            rows={2}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              value={newProduct.price}
              onChange={(e) => setNewProduct((s) => ({ ...s, price: e.target.value }))}
              placeholder="Prix (€)"
              className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              value={newProduct.allergens}
              onChange={(e) => setNewProduct((s) => ({ ...s, allergens: e.target.value }))}
              placeholder="Allergènes (séparés par une virgule)"
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={handleAddProduct}
              className="rounded-lg bg-red-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setAddingProduct(false)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
            >
              Annuler
            </button>
          </div>
          {newProductError && <p className="text-xs text-red-700">{newProductError}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingProduct(true)}
          className="text-xs text-red-800 underline"
        >
          + Ajouter un produit
        </button>
      )}
    </section>
  );
}
