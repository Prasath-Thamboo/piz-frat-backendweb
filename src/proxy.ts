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

function prefixOwner(pathname: string): Role | null {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/cuisine")) return "CUISINIER";
  if (pathname.startsWith("/livreur")) return "LIVREUR";
  if (pathname.startsWith("/compte")) return "CLIENT";
  return null;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
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
  matcher: ["/admin/:path*", "/cuisine/:path*", "/livreur/:path*", "/compte/:path*"],
};
