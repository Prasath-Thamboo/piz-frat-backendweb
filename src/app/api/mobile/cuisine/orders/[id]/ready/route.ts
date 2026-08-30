import { NextResponse } from "next/server";
import { requireMobileRole } from "@/lib/mobile-auth";
import { markReady } from "@/lib/kitchen";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/mobile/cuisine/orders/[id]/ready">,
) {
  const auth = await requireMobileRole(req, "CUISINIER");
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const result = await markReady(id);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
