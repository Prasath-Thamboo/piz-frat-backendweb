"use client";

import { useState, useTransition } from "react";
import {
  updateProductAction,
  setProductAvailabilityAction,
  deleteProductAction,
  createSupplementAction,
} from "./actions";
import { SupplementEditor } from "./supplement-editor";

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

function parseAllergens(value: string): string[] {
  return value
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

export function ProductEditor({ product }: { product: ProductData }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState((product.priceCents / 100).toFixed(2));
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [allergens, setAllergens] = useState(product.allergens.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [addingSupplement, setAddingSupplement] = useState(false);
  const [supName, setSupName] = useState("");
  const [supPrice, setSupPrice] = useState("");
  const [supError, setSupError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    const priceCents = Math.round(Number(price) * 100);
    if (Number.isNaN(priceCents) || priceCents < 0) {
      setError("Prix invalide.");
      return;
    }
    startTransition(async () => {
      const result = await updateProductAction(product.id, {
        name,
        description,
        priceCents,
        imageUrl: imageUrl || undefined,
        allergens: parseAllergens(allergens),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function handleToggleAvailable() {
    startTransition(async () => {
      await setProductAvailabilityAction(product.id, !product.available);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProductAction(product.id);
      if ("error" in result) setError(result.error);
    });
  }

  function handleAddSupplement() {
    setSupError(null);
    const priceCents = Math.round(Number(supPrice) * 100);
    if (!supName.trim()) {
      setSupError("Nom requis.");
      return;
    }
    if (Number.isNaN(priceCents) || priceCents < 0) {
      setSupError("Prix invalide.");
      return;
    }
    startTransition(async () => {
      const result = await createSupplementAction(product.id, { name: supName, priceCents });
      if ("error" in result) {
        setSupError(result.error);
        return;
      }
      setSupName("");
      setSupPrice("");
      setAddingSupplement(false);
    });
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      {editing ? (
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={2}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Prix (€)"
              className="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL de l'image"
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <input
            value={allergens}
            onChange={(e) => setAllergens(e.target.value)}
            placeholder="Allergènes (séparés par une virgule)"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
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
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{product.name}</p>
            {product.description && (
              <p className="text-sm text-neutral-500">{product.description}</p>
            )}
            {product.allergens.length > 0 && (
              <p className="text-xs text-neutral-400">
                Allergènes : {product.allergens.join(", ")}
              </p>
            )}
            <p className="text-sm font-medium text-red-800">
              {(product.priceCents / 100).toFixed(2)} €
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-xs font-medium ${product.available ? "text-green-700" : "text-neutral-400"}`}
            >
              {product.available ? "Disponible" : "Indisponible"}
            </span>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={handleToggleAvailable}
                className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700 disabled:opacity-60"
              >
                {product.available ? "Marquer indispo" : "Marquer dispo"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700"
              >
                Modifier
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleDelete}
                className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700 disabled:opacity-60"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}

      {product.supplements.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
          {product.supplements.map((s) => (
            <SupplementEditor key={s.id} supplement={s} />
          ))}
        </div>
      )}

      {addingSupplement ? (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3">
          <input
            value={supName}
            onChange={(e) => setSupName(e.target.value)}
            placeholder="Nom du supplément"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            value={supPrice}
            onChange={(e) => setSupPrice(e.target.value)}
            placeholder="Prix (€)"
            className="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending}
            onClick={handleAddSupplement}
            className="rounded-lg bg-red-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => setAddingSupplement(false)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
          >
            Annuler
          </button>
          {supError && <p className="w-full text-xs text-red-700">{supError}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingSupplement(true)}
          className="mt-2 text-xs text-red-800 underline"
        >
          + Ajouter un supplément
        </button>
      )}
    </div>
  );
}
