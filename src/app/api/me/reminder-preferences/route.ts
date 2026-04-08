import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";

const schema = z.object({
  childId: z.string().uuid(),
  reminder_email: z.string().email(),
  email_enabled: z.boolean(),
  remind_one_day: z.boolean(),
  remind_two_hours: z.boolean(),
  timezone: z.string().min(1),
});

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const body = schema.parse(await request.json());

    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id")
      .eq("id", body.childId)
      .single();

    if (childError || !child) return jsonError("Không tìm thấy hồ sơ bé.", 404);

    const { data, error } = await supabase
      .from("reminder_preferences")
      .upsert(
        {
          child_id: body.childId,
          reminder_email: body.reminder_email,
          email_enabled: body.email_enabled,
          remind_one_day: body.remind_one_day,
          remind_two_hours: body.remind_two_hours,
          timezone: body.timezone,
        },
        { onConflict: "child_id" },
      )
      .select("*")
      .single();

    if (error) return jsonError(error.message, 400);

    trackEvent("reminder_preferences_updated", {
      userId: user.id,
      childId: body.childId,
    });

    return NextResponse.json({ reminderPreferences: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
