"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelOrder } from "./actions";

export function CancelButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-800 disabled:opacity-60"
      >
        {pending ? "Annulation..." : "Annuler la commande"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
