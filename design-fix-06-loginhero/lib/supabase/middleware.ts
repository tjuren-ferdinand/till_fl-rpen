import { NextResponse, type NextRequest } from "next/server";

/**
 * DESIGN-POOL — middleware är en ren passthrough. Ingen auth-gate,
 * ingen domänkanonisering: alla sidor är åtkomliga utan inloggning.
 */
export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request });
}
