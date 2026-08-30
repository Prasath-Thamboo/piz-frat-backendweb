"use client";

import { useState, useTransition } from "react";
import { resolveFeedbackAction } from "../actions";

export function FeedbackModeration({
  feedbackId,
  resolution,
  refundCents,
}: {
  feedbackId: string;
  resolution: string | null;
  refundCents: number | null;
}) {
  const [resolutionText, setResolutionText] = useState(resolution ?? "");
  const [refundEuros, setRefundEuros] = useState(
    refundCents !== null ? (refundCents / 100).toFixed(2) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(status: "EN_COURS" | "RESOLU") {
    setError(null);
    const parsedEuros = refundEuros.trim() ? Number(refundEuros) : undefined;
    if (parsedEuros !== undefined && (Number.isNaN(parsedEuros) || parsedEuros < 0)) {
      setError("Montant de remboursement invalide.");
      return;
    }
    startTransition(async () => {
      const result = await resolveFeedbackAction(feedbackId, {
        status,
        resolution: resolutionText,
        refundCents: parsedEuros !== undefined ? Math.round(parsedEuros * 100) : undefined,
      });
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        value={resolutionText}
        onChange={(e) => setResolutionText(e.target.value)}
        placeholder="Réponse au client..."
        rows={2}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-500">
          Remboursement / geste commercial (€, optionnel)
        </span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={refundEuros}
          onChange={(e) => setRefundEuros(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm sm:w-48"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("EN_COURS")}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-60"
        >
          Marquer en cours
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("RESOLU")}
          className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Marquer résolu
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
