"use client";

import { useState, useTransition } from "react";
import { markDeliveredAction } from "./actions";

export function DeliveredButton({ orderId }: { orderId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await markDeliveredAction(orderId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        Marquer livrée
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
