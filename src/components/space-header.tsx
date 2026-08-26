import { auth, signOut } from "@/auth";

export async function SpaceHeader({ title }: { title: string }) {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-400">
          Pizza Fratelli
        </p>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-neutral-500">{session?.user?.name}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/connexion" });
          }}
        >
          <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:bg-neutral-100">
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
