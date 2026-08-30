"use client";

import { useTransition } from "react";
import { setZoneStatusAction } from "../actions";

type Zone = "SALLE" | "TERRASSE";
type Status = "DISPONIBLE" | "COMPLET";

const ZONE_LABEL: Record<Zone, string> = { SALLE: "Salle", TERRASSE: "Terrasse" };

export function ZoneStatusToggle({ zone, status }: { zone: Zone; status: Status }) {
  const [pending, startTransition] = useTransition();

  function set(next: Status) {
    if (next === status) return;
    startTransition(async () => {
      await setZoneStatusAction(zone, next);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
      <span className="font-medium">{ZONE_LABEL[zone]}</span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => set("DISPONIBLE")}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
            status === "DISPONIBLE"
              ? "border-green-700 bg-green-50 text-green-700"
              : "border-neutral-300 text-neutral-600"
          }`}
        >
          Disponible
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => set("COMPLET")}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
            status === "COMPLET"
              ? "border-red-800 bg-red-50 text-red-800"
              : "border-neutral-300 text-neutral-600"
          }`}
        >
          Complet
        </button>
      </div>
    </div>
  );
}
