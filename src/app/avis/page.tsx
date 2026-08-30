import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AvisView } from "./avis-view";

export default async function AvisPage() {
  const session = await auth();

  const [published, ownPending] = await Promise.all([
    prisma.review.findMany({
      where: { published: true },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    session
      ? prisma.review.findMany({
          where: { userId: session.user.id, published: false },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">Pizza Fratelli</p>
          <h1 className="text-lg font-semibold">Avis clients</h1>
        </div>
        <Link
          href={session ? "/compte" : "/connexion"}
          className="rounded-lg border border-red-800 px-3 py-1.5 text-sm font-medium text-red-800"
        >
          {session ? "Mon compte" : "Connexion"}
        </Link>
      </header>

      <main className="flex-1 p-4">
        <AvisView
          canPost={Boolean(session)}
          ownPendingCount={ownPending.length}
          reviews={published.map((r) => ({
            id: r.id,
            authorName: r.user.name,
            rating: r.rating,
            comment: r.comment,
            adminReply: r.adminReply,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
