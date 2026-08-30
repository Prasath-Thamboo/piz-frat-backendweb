"use client";

import { useState, useTransition } from "react";
import { createCategoryAction } from "./actions";

export function NewCategoryForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    startTransition(async () => {
      const result = await createCategoryAction({ name });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setName("");
    });
  }

  return (
    <section className="flex flex-wrap items-end gap-2 rounded-xl border border-neutral-200 bg-white p-4">
      <label className="text-sm">
        <span className="mb-1 block text-neutral-500">Nouvelle catégorie</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la catégorie"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={handleSubmit}
        className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Ajout..." : "Ajouter"}
      </button>
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
    </section>
  );
}
