"use client";

import { useState, useTransition } from "react";
import { updatePromotionAction, deletePromotionAction } from "./actions";
import { PromotionForm, type PromotionFormValues } from "./promotion-form";
import type { PromotionAudience } from "@/generated/prisma/enums";

type PromotionData = {
  id: string;
  title: string;
  description: string;
  audience: PromotionAudience;
  startAt: string;
  endAt: string;
  targetUserIds: string[];
  status: "à venir" | "active" | "terminée";
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_STYLE: Record<PromotionData["status"], string> = {
  "à venir": "text-amber-600",
  active: "text-green-700",
  terminée: "text-neutral-400",
};

export function PromotionItem({
  promotion,
  clients,
}: {
  promotion: PromotionData;
  clients: { id: string; name: string; email: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave(values: PromotionFormValues) {
    setError(null);
    startTransition(async () => {
      const result = await updatePromotionAction(promotion.id, values);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deletePromotionAction(promotion.id);
      if ("error" in result) setError(result.error);
    });
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <PromotionForm
          clients={clients}
          initial={{
            title: promotion.title,
            description: promotion.description,
            audience: promotion.audience,
            startAt: toDatetimeLocalValue(promotion.startAt),
            endAt: toDatetimeLocalValue(promotion.endAt),
            targetUserIds: promotion.targetUserIds,
          }}
          pending={pending}
          error={error}
          submitLabel="Enregistrer"
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{promotion.title}</p>
          <p className="text-sm text-neutral-500">{promotion.description}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {promotion.audience === "GENERALE"
              ? "Tous les clients"
              : `${promotion.targetUserIds.length} client(s) ciblé(s)`}
            {" — "}
            {new Date(promotion.startAt).toLocaleString("fr-FR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {" → "}
            {new Date(promotion.endAt).toLocaleString("fr-FR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <span className={`whitespace-nowrap text-xs font-medium ${STATUS_STYLE[promotion.status]}`}>
          {promotion.status}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
        >
          Modifier
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-60"
        >
          Supprimer
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
