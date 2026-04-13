import { NextResponse } from "next/server";

import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { generateCalendarICS } from "@/lib/ics";
import { FamilyMember, ScheduleItem } from "@/lib/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { id } = await context.params;

    const [{ data: member, error: memberError }, { data: items, error: itemsError }] =
      await Promise.all([
        supabase.from("family_members").select("*").eq("id", id).single(),
        supabase
          .from("member_vaccine_items")
          .select("*")
          .eq("member_id", id)
          .order("scheduled_date", { ascending: true }),
      ]);

    if (memberError || !member) return jsonError("Không tìm thấy hồ sơ thành viên.", 404);
    if (itemsError) return jsonError(itemsError.message, 400);

    // Only export items that are still pending (planned/overdue), not completed/skipped
    const pendingItems = ((items ?? []) as ScheduleItem[]).filter(
      (item) => item.status === "planned" || item.status === "overdue",
    );

    const ics = generateCalendarICS({
      memberName: (member as FamilyMember).name,
      timezone: (member as FamilyMember).timezone,
      items: pendingItems,
    });

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${(member as FamilyMember).name}-schedule.ics"`,
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
