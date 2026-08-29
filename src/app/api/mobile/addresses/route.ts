import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";
import { addAddressForUser } from "@/lib/orders";

export async function GET(req: Request) {
  const auth = await getMobileUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: auth.sub },
    orderBy: { isDefault: "desc" },
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const auth = await getMobileUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const result = await addAddressForUser(auth.sub, {
    label: String(body?.label ?? ""),
    line1: String(body?.line1 ?? ""),
    postalCode: String(body?.postalCode ?? ""),
    city: String(body?.city ?? ""),
  });

  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result, { status: 201 });
}
