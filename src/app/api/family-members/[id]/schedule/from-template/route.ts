import { NextResponse } from "next/server";

import { trackEvent } from "@/lib/analytics";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { buildScheduleFromTemplates } from "@/lib/db";
import { FamilyMember, ScheduleItem, VaccineTemplate } from "@/lib/types";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    const { data: member, error: memberError } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", id)
      .single();

    if (memberError || !member) return jsonError("Không tìm thấy hồ sơ thành viên.", 404);

    const typedMember = member as FamilyMember;

    const { data: templates, error: templateError } = await supabase
      .from("vaccine_templates")
      .select("*")
      .eq("target_member_type", typedMember.member_type)
      .order("sort_order", { ascending: true });

    if (templateError) return jsonError(templateError.message, 400);

    const items = buildScheduleFromTemplates(
      typedMember,
      (templates ?? []) as VaccineTemplate[],
    );

    const { data: upsertedItems, error: upsertError } = await supabase
      .from("member_vaccine_items")
      .upsert(items, { onConflict: "member_id,template_entry_id" })
      .select("*");

    if (upsertError) return jsonError(upsertError.message, 400);

    const { ensurePendingNotifications } = await import("@/lib/reminders-server");
    await ensurePendingNotifications(supabase, id, (upsertedItems ?? []) as ScheduleItem[]);

    trackEvent("schedule_generated_from_template", {
      userId: user.id,
      memberId: id,
      memberType: typedMember.member_type,
    });

    return NextResponse.json({ created: items.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
