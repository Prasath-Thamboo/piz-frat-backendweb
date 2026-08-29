"use client";

import { useState, useTransition } from "react";
import { acceptOrderAction, refuseOrderAction } from "./actions";

export function OrderActions({ orderId }: { orderId: string }) {
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
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(acceptOrderAction)}
          className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Accepter
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(refuseOrderAction)}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-60"
        >
          Refuser
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
