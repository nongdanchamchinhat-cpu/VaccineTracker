import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { DEFAULT_APPOINTMENT_TIME } from "@/lib/constants";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";

const schema = z.object({
  child_id: z.string().uuid(),
  vaccine_name: z.string().min(1),
  disease: z.string().min(1),
  origin: z.string().min(1),
  estimated_price: z.number().nullable(),
  scheduled_date: z.string().date(),
  milestone: z.string().min(1),
  recommended_age_label: z.string().min(1),
  notes: z.string().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const body = schema.parse(await request.json());
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id")
      .eq("id", body.child_id)
      .single();

    if (childError || !child) return jsonError("Không tìm thấy hồ sơ bé.", 404);

    const { data, error } = await supabase
      .from("child_vaccine_items")
      .insert({
        child_id: body.child_id,
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
        template_source: "custom",
      })
      .select("*")
      .single();

    if (error) return jsonError(error.message, 400);

    trackEvent("custom_schedule_item_created", {
      userId: user.id,
      childId: body.child_id,
    });

    return NextResponse.json({ item: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
