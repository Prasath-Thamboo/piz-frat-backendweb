"use client";

import { useState, useTransition } from "react";
import {
  updateSupplementAction,
  setSupplementAvailabilityAction,
  deleteSupplementAction,
} from "./actions";

type SupplementData = { id: string; name: string; priceCents: number; available: boolean };

export function SupplementEditor({ supplement }: { supplement: SupplementData }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(supplement.name);
  const [price, setPrice] = useState((supplement.priceCents / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    const priceCents = Math.round(Number(price) * 100);
    if (Number.isNaN(priceCents) || priceCents < 0) {
      setError("Prix invalide.");
      return;
    }
    startTransition(async () => {
      const result = await updateSupplementAction(supplement.id, { name, priceCents });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function handleToggleAvailable() {
    startTransition(async () => {
      await setSupplementAvailabilityAction(supplement.id, !supplement.available);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteSupplementAction(supplement.id);
      if ("error" in result) setError(result.error);
    });
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-end gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={pending}
          onClick={handleSave}
          className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
        >
          Annuler
        </button>
        {error && <p className="w-full text-xs text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>
        {supplement.name} — {(supplement.priceCents / 100).toFixed(2)} €{" "}
        <span className={supplement.available ? "text-green-700" : "text-neutral-400"}>
          ({supplement.available ? "disponible" : "indisponible"})
        </span>
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleToggleAvailable}
          className="text-xs text-neutral-600 underline disabled:opacity-60"
        >
          {supplement.available ? "Rendre indispo" : "Rendre dispo"}
        </button>
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-neutral-600 underline">
          Modifier
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          className="text-xs text-neutral-600 underline disabled:opacity-60"
        >
          Supprimer
        </button>
      </div>
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
    </div>
  );
}
