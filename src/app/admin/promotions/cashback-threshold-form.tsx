"use client";

import { useState, useTransition } from "react";
import { setCashbackThresholdAction } from "./actions";

export function CashbackThresholdForm({ currentCents }: { currentCents: number }) {
  const [value, setValue] = useState((currentCents / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSaved(false);
    const euros = Number(value);
    if (Number.isNaN(euros) || euros <= 0) {
      setError("Entrez un montant positif.");
      return;
    }
    startTransition(async () => {
      const result = await setCashbackThresholdAction(Math.round(euros * 100));
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div>
        <p className="font-medium">Seuil de cashback fidélité</p>
        <p className="text-sm text-neutral-500">
          Montant cumulé à atteindre pour qu&apos;un client obtienne un cashback (§3.4).
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-neutral-500">Seuil (€)</span>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={handleSubmit}
          className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {saved && !error && <p className="text-sm text-green-700">Seuil mis à jour.</p>}
    </section>
  );
}
