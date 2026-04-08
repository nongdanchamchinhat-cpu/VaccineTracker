import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";

const schema = z.object({
  scheduled_date: z.string().date(),
  estimated_price: z.number().nullable(),
  actual_price: z.number().nullable(),
  vaccine_name: z.string().min(1),
  disease: z.string().min(1),
  origin: z.string().min(1),
  notes: z.string().nullable(),
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
      .from("child_vaccine_items")
      .update({
        scheduled_date: body.scheduled_date,
        estimated_price: body.estimated_price,
        actual_price: body.actual_price,
        vaccine_name: body.vaccine_name,
        disease: body.disease,
        origin: body.origin,
        notes: body.notes,
        status: body.status,
        completed_at: completedAt,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return jsonError(error?.message ?? "Không thể cập nhật mũi.", 400);

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
