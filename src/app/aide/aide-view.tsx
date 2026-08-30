"use client";

import { useState, useTransition } from "react";
import { createFeedback } from "./actions";

type OrderOption = { id: string; mode: "LIVRAISON" | "EMPORTER"; createdAt: string };

type FeedbackItem = {
  id: string;
  message: string;
  status: "OUVERT" | "EN_COURS" | "RESOLU";
  resolution: string | null;
  refundCents: number | null;
  orderId: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<FeedbackItem["status"], string> = {
  OUVERT: "Ouvert",
  EN_COURS: "En cours de traitement",
  RESOLU: "Résolu",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function AideView({
  orders,
  feedbacks,
}: {
  orders: OrderOption[];
  feedbacks: FeedbackItem[];
}) {
  const [items, setItems] = useState(feedbacks);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (!message.trim()) {
      setError("Décrivez le problème rencontré.");
      return;
    }
    startTransition(async () => {
      const result = await createFeedback({
        message,
        orderId: orderId || undefined,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setItems((prev) => [
        {
          id: result.feedbackId,
          message,
          status: "OUVERT",
          resolution: null,
          refundCents: null,
          orderId: orderId || null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setMessage("");
      setOrderId("");
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-medium text-neutral-500">Signaler un problème</h2>

        {orders.length > 0 && (
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-500">Commande concernée (optionnel)</span>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Aucune commande en particulier</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  #{o.id.slice(-6)} — {o.mode === "LIVRAISON" ? "Livraison" : "À emporter"} —{" "}
                  {formatDate(o.createdAt)}
                </option>
              ))}
            </select>
          </label>
        )}

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Décrivez le problème rencontré (commande erronée, retard, souci technique...)"
          rows={4}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Envoi..." : "Envoyer"}
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Mes signalements</h2>
        {items.length === 0 && (
          <p className="text-sm text-neutral-500">Aucun signalement pour l&apos;instant.</p>
        )}
        {items.map((f) => (
          <div key={f.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-neutral-700">{f.message}</p>
              <span
                className={`whitespace-nowrap text-xs font-medium ${
                  f.status === "RESOLU"
                    ? "text-green-700"
                    : f.status === "EN_COURS"
                      ? "text-amber-600"
                      : "text-neutral-500"
                }`}
              >
                {STATUS_LABEL[f.status]}
              </span>
            </div>
            {f.orderId && (
              <p className="mt-1 text-xs text-neutral-400">Commande #{f.orderId.slice(-6)}</p>
            )}
            {f.resolution && (
              <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm">
                <p className="text-xs font-medium text-neutral-500">Réponse de Pizza Fratelli</p>
                <p className="mt-1 text-neutral-700">{f.resolution}</p>
                {f.refundCents !== null && f.refundCents > 0 && (
                  <p className="mt-1 font-medium text-red-800">
                    Geste commercial : {(f.refundCents / 100).toFixed(2)} €
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
