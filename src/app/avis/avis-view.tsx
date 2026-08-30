"use client";

import { useState, useTransition } from "react";
import { createReview } from "./actions";

type ReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  adminReply: string | null;
  createdAt: string;
};

const STARS = [1, 2, 3, 4, 5] as const;

export function AvisView({
  canPost,
  ownPendingCount,
  reviews,
}: {
  canPost: boolean;
  ownPendingCount: number;
  reviews: ReviewItem[];
}) {
  const [pendingCount, setPendingCount] = useState(ownPendingCount);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createReview({ rating, comment });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setComment("");
      setPendingCount((n) => n + 1);
      setSubmitted(true);
    });
  }

  return (
    <div className="space-y-6">
      {canPost && (
        <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-medium text-neutral-500">Laisser un avis</h2>

          <div className="flex gap-1">
            {STARS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`text-2xl leading-none ${n <= rating ? "text-amber-500" : "text-neutral-300"}`}
                aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Votre avis sur le restaurant..."
            rows={3}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Envoi..." : "Publier mon avis"}
          </button>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {submitted && !error && (
            <p className="text-sm text-neutral-500">
              Merci ! Votre avis sera visible après validation par l&apos;équipe.
            </p>
          )}
          {pendingCount > 0 && !submitted && (
            <p className="text-sm text-neutral-500">
              Vous avez {pendingCount} avis en attente de modération.
            </p>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Avis publiés</h2>
        {reviews.length === 0 && (
          <p className="text-sm text-neutral-500">Aucun avis pour l&apos;instant.</p>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{r.authorName}</p>
              <span className="text-amber-500">{"★".repeat(r.rating)}</span>
            </div>
            <p className="mt-1 text-sm text-neutral-700">{r.comment}</p>
            {r.adminReply && (
              <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm">
                <p className="text-xs font-medium text-neutral-500">Réponse de Pizza Fratelli</p>
                <p className="mt-1 text-neutral-700">{r.adminReply}</p>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
