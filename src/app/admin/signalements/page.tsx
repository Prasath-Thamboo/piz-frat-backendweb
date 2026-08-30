import { SpaceHeader } from "@/components/space-header";
import { prisma } from "@/lib/prisma";
import { FeedbackModeration } from "./feedback-moderation";

const STATUS_LABEL: Record<"OUVERT" | "EN_COURS" | "RESOLU", string> = {
  OUVERT: "Ouvert",
  EN_COURS: "En cours de traitement",
  RESOLU: "Résolu",
};

export default async function AdminSignalementsPage() {
  const feedbacks = await prisma.feedback.findMany({
    include: { user: true, order: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SpaceHeader title="Signalements clients" />
      <main className="flex-1 space-y-3 p-4">
        {feedbacks.length === 0 && (
          <p className="text-sm text-neutral-500">Aucun signalement pour l&apos;instant.</p>
        )}
        {feedbacks.map((f) => (
          <div key={f.id} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{f.user.name}</p>
                {f.order && (
                  <p className="text-xs text-neutral-400">Commande #{f.order.id.slice(-6)}</p>
                )}
                <p className="mt-1 text-sm text-neutral-700">{f.message}</p>
              </div>
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
            <FeedbackModeration
              feedbackId={f.id}
              resolution={f.resolution}
              refundCents={f.refundCents}
            />
          </div>
        ))}
      </main>
    </div>
  );
}
