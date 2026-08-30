"use client";

import { useState, useTransition } from "react";
import {
  replyToReviewAction,
  setReviewPublishedAction,
  deleteReviewAction,
} from "../actions";

export function ReviewModeration({
  reviewId,
  published,
  adminReply,
}: {
  reviewId: string;
  published: boolean;
  adminReply: string | null;
}) {
  const [reply, setReply] = useState(adminReply ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleReply() {
    setError(null);
    startTransition(async () => {
      const result = await replyToReviewAction(reviewId, reply);
      if ("error" in result) setError(result.error);
    });
  }

  function handleTogglePublish() {
    setError(null);
    startTransition(async () => {
      const result = await setReviewPublishedAction(reviewId, !published);
      if ("error" in result) setError(result.error);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteReviewAction(reviewId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Répondre à cet avis..."
        rows={2}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleReply}
          className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Répondre
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleTogglePublish}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-60"
        >
          {published ? "Masquer" : "Publier"}
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
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
