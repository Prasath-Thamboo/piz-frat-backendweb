import type { Server as SocketIOServer } from "socket.io";
import type { Role } from "@/generated/prisma/enums";

// Notifications temps réel (§10.1) : le serveur Socket.IO est créé dans
// server.ts (hors du bundler Next, cf. server custom) et enregistré ici via
// setIo() pour être joignable depuis les server actions / route handlers.
// Le singleton est posé sur `globalThis`, pas sur une simple variable de
// module : en dev, Turbopack donne aux fichiers qu'il bundle (routes/server
// actions) un registre de modules distinct de celui que `node server.ts`
// utilise pour ses propres imports — une variable de module ordinaire créerait
// donc deux instances séparées de ce fichier, chacune avec son propre `io`
// (constaté en pratique : les notifications n'arrivaient jamais aux sockets
// connectés tant que ce n'était pas corrigé). `globalThis` reste, lui, unique
// pour tout le processus Node quel que soit le registre de modules d'origine.
declare global {
  var __pizzaFratelliIo: SocketIOServer | undefined;
}

export function setIo(server: SocketIOServer): void {
  globalThis.__pizzaFratelliIo = server;
}

// Une salle par utilisateur : notifications qui concernent son propre compte
// (statut de commande, proposition de livraison qui lui est adressée).
export function notifyUser(userId: string, message: string): void {
  globalThis.__pizzaFratelliIo?.to(`user:${userId}`).emit("notify", { message });
}

// Une salle par rôle : notifications qui concernent l'équipe dans son
// ensemble (nouvelle commande pour l'admin, file de préparation pour la
// cuisine).
export function notifyRole(role: Role, message: string): void {
  globalThis.__pizzaFratelliIo?.to(`role:${role}`).emit("notify", { message });
}
