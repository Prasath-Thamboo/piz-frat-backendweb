"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io as connectSocket, type Socket } from "socket.io-client";

// Notifications temps réel (§10.1) : se connecte au serveur Socket.IO
// (server.ts) avec un jeton dérivé de la session NextAuth courante
// (GET /api/socket-token, même mécanisme que l'auth mobile). Le serveur a
// déjà placé la connexion dans les salles pertinentes pour cet utilisateur
// (son propre compte + son rôle) — ce composant n'a donc rien à filtrer, il
// affiche simplement tout ce qui lui arrive et déclenche un rafraîchissement
// des données de la page (router.refresh(), pas de state client à gérer ici :
// tout est déjà chargé côté Server Component).
export function RealtimeRefresh() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/socket-token");
      if (!res.ok || cancelled) return;
      const { token } = (await res.json()) as { token: string };
      if (cancelled) return;

      const socket = connectSocket({ auth: { token } });
      socketRef.current = socket;

      socket.on("notify", ({ message }: { message: string }) => {
        setToast(message);
        router.refresh();
      });
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
    };
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
    </div>
  );
}
