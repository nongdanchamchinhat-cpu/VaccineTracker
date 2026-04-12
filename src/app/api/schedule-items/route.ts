import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { DEFAULT_APPOINTMENT_TIME } from "@/lib/constants";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { ScheduleItem } from "@/lib/types";

const schema = z.object({
  member_id: z.string().uuid(),
  vaccine_name: z.string().min(1),
  disease: z.string().min(1),
  origin: z.string().min(1),
  estimated_price: z.number().nullable(),
  scheduled_date: z.string().date(),
  milestone: z.string().min(1),
  recommended_age_label: z.string().min(1),
  notes: z.string().nullable(),
  lot_number: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
  adverse_reactions: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const body = schema.parse(await request.json());
    const { data: member, error: memberError } = await supabase
      .from("family_members")
      .select("id")
      .eq("id", body.member_id)
      .single();

    if (memberError || !member) return jsonError("Không tìm thấy hồ sơ thành viên.", 404);

    const { data: item, error } = await supabase
      .from("member_vaccine_items")
      .insert({
        member_id: body.member_id,
        sort_order: 9000,
        scheduled_date: body.scheduled_date,
        appointment_time_local: DEFAULT_APPOINTMENT_TIME,
        recommended_age_label: body.recommended_age_label,
        milestone: body.milestone,
        vaccine_name: body.vaccine_name,
        origin: body.origin,
        disease: body.disease,
        estimated_price: body.estimated_price,
        notes: body.notes,
        lot_number: body.lot_number ?? null,
        photo_url: body.photo_url ?? null,
        adverse_reactions: body.adverse_reactions ?? null,
        template_source: "custom",
      })
      .select("*")
      .single();

    if (error) return jsonError(error.message, 400);

    // Notifications pre-insertion
    const { ensurePendingNotifications } = await import("@/lib/reminders-server");
    await ensurePendingNotifications(supabase, body.member_id, [item] as ScheduleItem[]);

    trackEvent("custom_schedule_item_created", {
      userId: user.id,
      memberId: body.member_id,
    });

    return NextResponse.json({ item: item });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
