"use client";

import { useState, useTransition } from "react";
import { cancelReservationAction } from "../actions";

export function ReservationActions({ reservationId }: { reservationId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelReservationAction(reservationId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={handleCancel}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-60"
      >
        {pending ? "Annulation..." : "Annuler"}
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
