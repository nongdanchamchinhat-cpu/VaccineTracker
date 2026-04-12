import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { memberId, targetVersion } = await request.json();

    if (!memberId || !targetVersion) {
      return jsonError("memberId and targetVersion are required", 400);
    }

    // This is a stub for the upgrade logic.
    // In the future, this will diff the member's current schedule against the target version
    // and prompt/apply new vaccines or updated intervals seamlessly.

    await logAuditEvent(supabase, user.id, "UPGRADE_TEMPLATE_VERSION", "family_members", memberId, { targetVersion });

    return NextResponse.json({ message: "Upgrade scheduled or processed", targetVersion });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
