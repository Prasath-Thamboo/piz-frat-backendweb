import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { setIo } from "./src/lib/realtime.ts";
import { verifyMobileToken } from "./src/lib/mobile-token.ts";

// Serveur personnalisé (§10.1 — notifications temps réel) : `next dev`/`next
// start` seuls ne peuvent pas exposer un serveur Socket.IO, qui a besoin d'un
// http.Server persistant pour gérer l'upgrade WebSocket. On enveloppe donc le
// handler Next.js dans un serveur HTTP classique et on y attache Socket.IO —
// pattern documenté dans node_modules/next/dist/docs/01-app/02-guides/custom-server.md
// pour cette version de Next (cf. AGENTS.md : ne pas se fier aux souvenirs
// d'une version antérieure de Next.js sur ce point).
//
// Exécuté via `node server.ts` (support TypeScript natif de Node), PAS via
// `tsx` : le hook de require de tsx entre en conflit avec le bootstrap
// interne de Next (AsyncLocalStorage indisponible au chargement de `next`,
// erreur E504) — reproductible et confirmé en isolant le problème avant de
// changer d'approche. `node` natif n'a pas ce souci mais exige des specifiers
// d'import relatifs complets, d'où les extensions .ts explicites ci-dessus
// (et `allowImportingTsExtensions` dans tsconfig.json pour que `tsc` les
// accepte aussi).
const port = parseInt(process.env.PORT ?? "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  // Authentification de la connexion Socket.IO : même jeton et même
  // vérification que l'API mobile (src/lib/mobile-auth.ts) — le web récupère
  // le sien via GET /api/socket-token (qui le dérive de sa session NextAuth),
  // l'app mobile réutilise directement son token de connexion existant.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("unauthorized"));
      return;
    }
    const payload = await verifyMobileToken(token);
    if (!payload) {
      next(new Error("unauthorized"));
      return;
    }
    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    next();
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    socket.join(`role:${socket.data.role}`);
  });

  setIo(io);

  httpServer.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${dev ? "development" : process.env.NODE_ENV}`,
    );
  });
});
