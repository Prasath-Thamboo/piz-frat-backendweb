import { NextResponse } from "next/server";
import { requireMobileRole } from "@/lib/mobile-auth";
import { refuseProposal } from "@/lib/delivery";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/mobile/livreur/proposals/[id]/refuse">,
) {
  const auth = await requireMobileRole(req, "LIVREUR");
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const result = await refuseProposal(auth.sub, id);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
