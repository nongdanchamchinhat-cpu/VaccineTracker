import { NextResponse } from "next/server";

import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { generateCalendarICS } from "@/lib/ics";
import { ChildProfile, ScheduleItem } from "@/lib/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { id } = await context.params;

    const [{ data: child, error: childError }, { data: items, error: itemsError }] =
      await Promise.all([
        supabase.from("children").select("*").eq("id", id).single(),
        supabase
          .from("child_vaccine_items")
          .select("*")
          .eq("child_id", id)
          .order("scheduled_date", { ascending: true }),
      ]);

    if (childError || !child) return jsonError("Không tìm thấy hồ sơ bé.", 404);
    if (itemsError) return jsonError(itemsError.message, 400);

    const ics = generateCalendarICS({
      childName: (child as ChildProfile).name,
      timezone: (child as ChildProfile).timezone,
      items: (items ?? []) as ScheduleItem[],
    });

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${(child as ChildProfile).name}-schedule.ics"`,
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
