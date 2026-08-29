"use client";

import { useState, useTransition } from "react";
import type { OrderMode, OrderStatus } from "@/generated/prisma/enums";
import { takeOrderAction, markReadyAction, markRetrievedAction } from "./actions";

export function OrderActions({
  orderId,
  status,
  mode,
}: {
  orderId: string;
  status: OrderStatus;
  mode: OrderMode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<{ error: string } | { ok: true }>) {
    setError(null);
    startTransition(async () => {
      const result = await action(orderId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div>
      {status === "ACCEPTEE" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(takeOrderAction)}
          className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Prendre en charge
        </button>
      )}
      {status === "EN_PREPARATION" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(markReadyAction)}
          className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Marquer prête
        </button>
      )}
      {status === "PRETE" && mode === "EMPORTER" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(markRetrievedAction)}
          className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Marquer retirée
        </button>
      )}
      {status === "PRETE" && mode === "LIVRAISON" && (
        <span className="text-sm text-neutral-500">En attente d&apos;un livreur</span>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
