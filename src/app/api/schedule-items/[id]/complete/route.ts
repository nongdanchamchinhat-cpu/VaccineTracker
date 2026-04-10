import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { ScheduleItem } from "@/lib/types";

const schema = z.object({
  actual_price: z.number().nullable(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const body = schema.parse(await request.json());
    const { id } = await context.params;

    const { data, error } = await supabase
      .from("member_vaccine_items")
      .update({
        status: "completed",
        actual_price: body.actual_price,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return jsonError(error?.message ?? "Không thể hoàn tất mũi.", 400);

    if (data.recurrence_rule) {
      const { handleRecurrence } = await import("@/lib/db");
      const nextRecurringItem = await handleRecurrence(data.member_id, data as ScheduleItem);
      if (nextRecurringItem) {
        const { ensurePendingNotifications } = await import("@/lib/reminders-server");
        await ensurePendingNotifications(supabase, data.member_id, [nextRecurringItem as ScheduleItem]);
      }
    }

    const { ensurePendingNotifications } = await import("@/lib/reminders-server");
    await ensurePendingNotifications(supabase, data.member_id, [data] as ScheduleItem[]);

    trackEvent("schedule_item_completed", {
      userId: user.id,
      scheduleItemId: id,
    });

    return NextResponse.json({ item: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
