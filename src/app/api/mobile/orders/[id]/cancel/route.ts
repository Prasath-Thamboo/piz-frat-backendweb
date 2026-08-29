import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobile-auth";
import { cancelOrderForUser } from "@/lib/orders";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/mobile/orders/[id]/cancel">,
) {
  const auth = await getMobileUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const result = await cancelOrderForUser(auth.sub, id);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
