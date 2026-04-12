import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { ensureDefaultHousehold, ensureProfile } from "@/lib/db";
import { DEFAULT_REMINDER_OFFSETS } from "@/lib/reminders";

const schema = z.object({
  name: z.string().min(1),
  birth_date: z.string().date(),
  member_type: z.enum(["infant", "child", "teen", "adult", "senior", "pregnant"]).default("infant"),
  gender: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const body = schema.parse(await request.json());
    await ensureProfile(user.id, user.email ?? null);
    const householdId = await ensureDefaultHousehold(user.id);

    const { data, error } = await supabase
      .from("family_members")
      .insert({
        user_id: user.id,
        household_id: householdId,
        name: body.name,
        birth_date: body.birth_date,
        member_type: body.member_type,
        gender: body.gender ?? null,
        timezone: DEFAULT_TIMEZONE,
      })
      .select("*")
      .single();

    if (error) return jsonError(error.message, 400);

    await supabase.from("reminder_preferences").upsert(
      {
        member_id: data.id,
        reminder_email: user.email,
        reminder_offsets: DEFAULT_REMINDER_OFFSETS,
        timezone: DEFAULT_TIMEZONE,
      },
      { onConflict: "member_id" },
    );

    trackEvent("family_member_created", {
      userId: user.id,
      memberId: data.id,
      memberType: body.member_type,
    });

    return NextResponse.json({ member: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
