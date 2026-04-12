import { NextResponse } from "next/server";

import { jsonError, requireAuthenticatedUser } from "@/lib/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    const { data, error } = await supabase
      .from("member_vaccine_items")
      .select("*")
      .eq("member_id", id)
      .order("scheduled_date", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) return jsonError(error.message, 400);
    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
