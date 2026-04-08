import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { ensureProfile } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1),
  birth_date: z.string().date(),
  gender: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const body = schema.parse(await request.json());
    await ensureProfile(user.id, user.email ?? null);

    const { data, error } = await supabase
      .from("children")
      .insert({
        user_id: user.id,
        name: body.name,
        birth_date: body.birth_date,
        gender: body.gender ?? null,
        timezone: DEFAULT_TIMEZONE,
      })
      .select("*")
      .single();

    if (error) return jsonError(error.message, 400);

    await supabase.from("reminder_preferences").upsert(
      {
        child_id: data.id,
        reminder_email: user.email,
        timezone: DEFAULT_TIMEZONE,
      },
      { onConflict: "child_id" },
    );

    trackEvent("child_created", {
      userId: user.id,
      childId: data.id,
    });

    return NextResponse.json({ child: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
