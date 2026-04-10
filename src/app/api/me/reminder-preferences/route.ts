import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { ScheduleItem } from "@/lib/types";
import { normalizeReminderOffsets } from "@/lib/reminders";

const schema = z.object({
  memberId: z.string().uuid(),
  reminder_email: z.string().email(),
  email_enabled: z.boolean(),
  remind_one_day: z.boolean(),
  remind_two_hours: z.boolean(),
  reminder_offsets: z.array(z.object({
    days: z.number().optional(),
    hours: z.number().optional(),
    minutes: z.number().optional(),
  })).optional(),
  timezone: z.string().min(1),
});

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const body = schema.parse(await request.json());

    const finalOffsets = normalizeReminderOffsets(body.reminder_offsets, body);

    const { data: member, error: memberError } = await supabase
      .from("family_members")
      .select("id")
      .eq("id", body.memberId)
      .single();

    if (memberError || !member) return jsonError("Không tìm thấy hồ sơ thành viên.", 404);

    const { data, error } = await supabase
      .from("reminder_preferences")
      .upsert(
        {
          member_id: body.memberId,
          reminder_email: body.reminder_email,
          email_enabled: body.email_enabled,
          remind_one_day: body.remind_one_day,
          remind_two_hours: body.remind_two_hours,
          reminder_offsets: finalOffsets,
          timezone: body.timezone,
        },
        { onConflict: "member_id" },
      )
      .select("*")
      .single();

    if (error) return jsonError(error.message, 400);

    // Recalculate notifications for all planned items
    const { data: items } = await supabase
      .from("member_vaccine_items")
      .select("*")
      .eq("member_id", body.memberId)
      .in("status", ["planned", "overdue"]);

    if (items && items.length > 0) {
      const { ensurePendingNotifications } = await import("@/lib/reminders-server");
      await ensurePendingNotifications(supabase, body.memberId, items as ScheduleItem[]);
    }

    trackEvent("reminder_preferences_updated", {
      userId: user.id,
      memberId: body.memberId,
    });

    return NextResponse.json({ reminderPreferences: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
