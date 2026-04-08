import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";

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
      .from("child_vaccine_items")
      .update({
        status: "completed",
        actual_price: body.actual_price,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return jsonError(error?.message ?? "Không thể hoàn tất mũi.", 400);

    trackEvent("schedule_item_completed", {
      userId: user.id,
      scheduleItemId: id,
    });

    return NextResponse.json({ item: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
