import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import type { Role } from "@/generated/prisma/enums";

const { auth } = NextAuth(authConfig);

// Cloisonnement strict entre espaces (cf. §4.12 et §10.2 du cahier des charges) :
// chaque rôle n'accède qu'aux routes de son propre espace.
const ROLE_PREFIXES: Record<Role, string> = {
  ADMIN: "/admin",
  CUISINIER: "/cuisine",
  LIVREUR: "/livreur",
  CLIENT: "/compte",
};

// L'app mobile (Expo) est un client cross-origin : ses écrans web (et un
// futur build web) appellent /api/mobile/* depuis une autre origine, ce que
// le navigateur bloque sans en-têtes CORS explicites (curl/l'app native n'y
// sont eux pas soumis, d'où l'écart entre tests serveur-à-serveur et navigateur).
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function prefixOwner(pathname: string): Role | null {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/cuisine")) return "CUISINIER";
  if (pathname.startsWith("/livreur")) return "LIVREUR";
  if (
    pathname.startsWith("/compte") ||
    pathname.startsWith("/panier") ||
    pathname.startsWith("/commandes")
  )
    return "CLIENT";
  return null;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/mobile")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }
    const res = NextResponse.next();
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      res.headers.set(key, value);
    }
    return res;
  }

  const owner = prefixOwner(pathname);
  if (!owner) return NextResponse.next();

  const role = req.auth?.user?.role;
  if (!role) {
    const signInUrl = new URL("/connexion", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (role !== owner) {
    return NextResponse.redirect(
      new URL(ROLE_PREFIXES[role], req.nextUrl.origin),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/cuisine/:path*",
    "/livreur/:path*",
    "/compte/:path*",
    "/panier/:path*",
    "/commandes/:path*",
    "/api/mobile/:path*",
  ],
};
