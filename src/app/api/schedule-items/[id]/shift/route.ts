import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { proposeShiftedSchedule } from "@/lib/schedule-logic";
import { ScheduleItem } from "@/lib/types";

const schema = z.object({
  new_date: z.string().date(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    const body = schema.parse(await request.json());

    const { data: targetItem, error: targetError } = await supabase
      .from("member_vaccine_items")
      .select("*")
      .eq("id", id)
      .single();

    if (targetError || !targetItem) {
      return jsonError("Không tìm thấy mũi cần dời lịch.", 404);
    }

    const { data: allItems, error: itemsError } = await supabase
      .from("member_vaccine_items")
      .select("*")
      .eq("member_id", targetItem.member_id)
      .order("scheduled_date", { ascending: true })
      .order("sort_order", { ascending: true });

    if (itemsError) {
      return jsonError(itemsError.message, 500);
    }

    const proposal = proposeShiftedSchedule(
      targetItem as ScheduleItem,
      (allItems ?? []) as ScheduleItem[],
      body.new_date,
    );

    return NextResponse.json(proposal);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
