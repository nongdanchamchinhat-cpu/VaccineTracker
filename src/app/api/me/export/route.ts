import { NextResponse } from "next/server";

import { jsonError, requireAuthenticatedUser } from "@/lib/api";

export async function GET() {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: memberships, error: membershipsError } = await supabase
      .from("household_memberships")
      .select("*")
      .eq("user_id", user.id);

    if (membershipsError) return jsonError(membershipsError.message, 400);

    const householdIds = (memberships ?? []).map((membership) => membership.household_id);
    const { data: households, error: householdsError } = await supabase
      .from("households")
      .select("*")
      .in("id", householdIds);

    if (householdsError) return jsonError(householdsError.message, 400);

    const { data: members, error: membersError } = await supabase
      .from("family_members")
      .select("*")
      .in("household_id", householdIds);

    if (membersError) return jsonError(membersError.message, 400);

    const memberIds = (members ?? []).map((member) => member.id);
    const [{ data: scheduleItems, error: scheduleError }, { data: reminderPreferences, error: reminderError }] =
      await Promise.all([
        memberIds.length > 0
          ? supabase.from("member_vaccine_items").select("*").in("member_id", memberIds)
          : Promise.resolve({ data: [], error: null }),
        memberIds.length > 0
          ? supabase.from("reminder_preferences").select("*").in("member_id", memberIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (scheduleError) return jsonError(scheduleError.message, 400);
    if (reminderError) return jsonError(reminderError.message, 400);

    const exportPayload = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
      },
      households: households ?? [],
      household_memberships: memberships ?? [],
      family_members: members ?? [],
      member_vaccine_items: scheduleItems ?? [],
      reminder_preferences: reminderPreferences ?? [],
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="family-vaccine-export.json"',
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
