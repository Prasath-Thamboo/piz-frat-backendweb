import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";
import { ReviewModeration } from "./review-moderation";

export default async function AdminAvisPage() {
  const reviews = await prisma.review.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Modération des avis" />
      <main className="flex-1 space-y-3 p-4">
        {reviews.length === 0 && (
          <p className="text-sm text-neutral-500">Aucun avis pour l&apos;instant.</p>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {r.user.name} <span className="text-amber-500">{"★".repeat(r.rating)}</span>
                </p>
                <p className="mt-1 text-sm text-neutral-700">{r.comment}</p>
              </div>
              <span
                className={`whitespace-nowrap text-xs font-medium ${
                  r.published ? "text-green-700" : "text-neutral-400"
                }`}
              >
                {r.published ? "Publié" : "Masqué"}
              </span>
            </div>
            <ReviewModeration reviewId={r.id} published={r.published} adminReply={r.adminReply} />
          </div>
        ))}
      </main>
    </div>
  );
}
