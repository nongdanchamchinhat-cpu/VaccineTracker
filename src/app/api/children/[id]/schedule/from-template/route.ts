import { NextResponse } from "next/server";

import { trackEvent } from "@/lib/analytics";
import { DEFAULT_TEMPLATE_VERSION } from "@/lib/constants";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { buildScheduleFromTemplates } from "@/lib/db";
import { ChildProfile, VaccineTemplate } from "@/lib/types";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("*")
      .eq("id", id)
      .single();

    if (childError || !child) return jsonError("Không tìm thấy hồ sơ bé.", 404);

    const { data: templates, error: templateError } = await supabase
      .from("vaccine_templates")
      .select("*")
      .eq("version", DEFAULT_TEMPLATE_VERSION)
      .order("sort_order", { ascending: true });

    if (templateError) return jsonError(templateError.message, 400);

    const items = buildScheduleFromTemplates(
      child as ChildProfile,
      (templates ?? []) as VaccineTemplate[],
    );

    const { error: upsertError } = await supabase
      .from("child_vaccine_items")
      .upsert(items, { onConflict: "child_id,template_entry_id" });

    if (upsertError) return jsonError(upsertError.message, 400);

    trackEvent("schedule_generated_from_template", {
      userId: user.id,
      childId: id,
      templateVersion: DEFAULT_TEMPLATE_VERSION,
    });

    return NextResponse.json({ created: items.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
