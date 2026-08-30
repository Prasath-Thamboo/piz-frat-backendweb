"use client";

import { useState } from "react";
import type { PromotionAudience } from "@/generated/prisma/enums";

export type PromotionFormValues = {
  title: string;
  description: string;
  audience: PromotionAudience;
  startAt: string;
  endAt: string;
  targetUserIds: string[];
};

type ClientOption = { id: string; name: string; email: string };

export function PromotionForm({
  clients,
  initial,
  pending,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  clients: ClientOption[];
  initial?: PromotionFormValues;
  pending: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (values: PromotionFormValues) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [audience, setAudience] = useState<PromotionAudience>(initial?.audience ?? "GENERALE");
  const [startAt, setStartAt] = useState(initial?.startAt ?? "");
  const [endAt, setEndAt] = useState(initial?.endAt ?? "");
  const [targetUserIds, setTargetUserIds] = useState<string[]>(initial?.targetUserIds ?? []);

  function toggleTarget(id: string) {
    setTargetUserIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAudience("GENERALE")}
          className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
            audience === "GENERALE"
              ? "border-red-800 bg-red-50 text-red-800"
              : "border-neutral-300 text-neutral-600"
          }`}
        >
          Tous les clients
        </button>
        <button
          type="button"
          onClick={() => setAudience("CIBLEE")}
          className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
            audience === "CIBLEE"
              ? "border-red-800 bg-red-50 text-red-800"
              : "border-neutral-300 text-neutral-600"
          }`}
        >
          Clients ciblés
        </button>
      </div>
      <div className="flex gap-2">
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-neutral-500">Début</span>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-neutral-500">Fin</span>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      {audience === "CIBLEE" && (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-2">
          {clients.length === 0 && <p className="text-xs text-neutral-500">Aucun client.</p>}
          {clients.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={targetUserIds.includes(c.id)}
                onChange={() => toggleTarget(c.id)}
              />
              {c.name} ({c.email})
            </label>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => onSubmit({ title, description, audience, startAt, endAt, targetUserIds })}
          className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
          >
            Annuler
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
