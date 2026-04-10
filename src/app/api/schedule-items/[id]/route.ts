import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { ScheduleItem } from "@/lib/types";

const schema = z.object({
  scheduled_date: z.string().date(),
  estimated_price: z.number().nullable(),
  actual_price: z.number().nullable(),
  vaccine_name: z.string().min(1),
  disease: z.string().min(1),
  origin: z.string().min(1),
  notes: z.string().nullable(),
  lot_number: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
  adverse_reactions: z.string().nullable().optional(),
  status: z.enum(["planned", "completed", "skipped"]),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const body = schema.parse(await request.json());
    const { id } = await context.params;
    const completedAt =
      body.status === "completed" ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from("member_vaccine_items")
      .update({
        scheduled_date: body.scheduled_date,
        estimated_price: body.estimated_price,
        actual_price: body.actual_price,
        vaccine_name: body.vaccine_name,
        disease: body.disease,
        origin: body.origin,
        notes: body.notes,
        lot_number: body.lot_number ?? null,
        photo_url: body.photo_url ?? null,
        adverse_reactions: body.adverse_reactions ?? null,
        status: body.status,
        completed_at: completedAt,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return jsonError(error?.message ?? "Không thể cập nhật mũi.", 400);

    if (body.status === "completed" && data.recurrence_rule) {
      const { handleRecurrence } = await import("@/lib/db");
      const nextRecurringItem = await handleRecurrence(data.member_id, data as ScheduleItem);
      if (nextRecurringItem) {
        const { ensurePendingNotifications } = await import("@/lib/reminders-server");
        await ensurePendingNotifications(supabase, data.member_id, [nextRecurringItem as ScheduleItem]);
      }
    }

    const { ensurePendingNotifications } = await import("@/lib/reminders-server");
    await ensurePendingNotifications(supabase, data.member_id, [data] as ScheduleItem[]);

    trackEvent("schedule_item_updated", {
      userId: user.id,
      scheduleItemId: id,
      status: body.status,
    });

    return NextResponse.json({ item: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
