"use client";

import { useState, useTransition } from "react";
import { createReservation, cancelReservation } from "./actions";

type Zone = "SALLE" | "TERRASSE";
type Status = "DISPONIBLE" | "COMPLET";

type ReservationItem = {
  id: string;
  zone: Zone;
  date: string;
  partySize: number;
  status: "CONFIRMEE" | "ANNULEE";
};

const ZONE_LABEL: Record<Zone, string> = { SALLE: "Salle", TERRASSE: "Terrasse" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function ReservationsView({
  reservations,
  roomStatus,
  terraceStatus,
}: {
  reservations: ReservationItem[];
  roomStatus: Status;
  terraceStatus: Status;
}) {
  const [items, setItems] = useState(reservations);
  const zoneAvailable: Record<Zone, boolean> = {
    SALLE: roomStatus === "DISPONIBLE",
    TERRASSE: terraceStatus === "DISPONIBLE",
  };

  const [zone, setZone] = useState<Zone>(zoneAvailable.SALLE ? "SALLE" : "TERRASSE");
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [submitPending, startSubmit] = useTransition();
  const [cancelPending, startCancel] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    if (!date) {
      setError("Choisissez une date et un horaire.");
      return;
    }
    startSubmit(async () => {
      const result = await createReservation({ zone, date, partySize });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setItems((prev) => [
        {
          id: result.reservationId,
          zone,
          date: new Date(date).toISOString(),
          partySize,
          status: "CONFIRMEE",
        },
        ...prev,
      ]);
      setDate("");
    });
  }

  function handleCancel(id: string) {
    setCancellingId(id);
    startCancel(async () => {
      const result = await cancelReservation(id);
      if ("ok" in result) {
        setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: "ANNULEE" } : r)));
      }
      setCancellingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-medium text-neutral-500">Nouvelle réservation</h2>

        <div className="flex gap-2">
          {(["SALLE", "TERRASSE"] as const).map((z) => (
            <button
              key={z}
              type="button"
              disabled={!zoneAvailable[z]}
              onClick={() => setZone(z)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                zone === z
                  ? "border-red-800 bg-red-50 text-red-800"
                  : "border-neutral-300 text-neutral-600"
              }`}
            >
              {ZONE_LABEL[z]}
              {!zoneAvailable[z] && " (complet)"}
            </button>
          ))}
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-neutral-500">Date et horaire</span>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-neutral-500">Nombre de convives</span>
          <input
            type="number"
            min={1}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitPending || !zoneAvailable[zone]}
          className="w-full rounded-lg bg-red-800 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitPending ? "Réservation..." : "Réserver"}
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Mes réservations</h2>
        {items.length === 0 && (
          <p className="text-sm text-neutral-500">Aucune réservation pour l&apos;instant.</p>
        )}
        {items.map((r) => (
          <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {ZONE_LABEL[r.zone]} — {r.partySize} pers.
                </p>
                <p className="text-sm text-neutral-500">{formatDate(r.date)}</p>
              </div>
              <span
                className={`text-xs font-medium ${
                  r.status === "CONFIRMEE" ? "text-green-700" : "text-neutral-400"
                }`}
              >
                {r.status === "CONFIRMEE" ? "Confirmée" : "Annulée"}
              </span>
            </div>
            {r.status === "CONFIRMEE" && (
              <button
                type="button"
                onClick={() => handleCancel(r.id)}
                disabled={cancelPending && cancellingId === r.id}
                className="mt-2 text-xs text-red-800 underline disabled:opacity-60"
              >
                {cancelPending && cancellingId === r.id ? "Annulation..." : "Annuler"}
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
