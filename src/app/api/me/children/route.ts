import { NextResponse } from "next/server";

import { jsonError, requireAuthenticatedUser } from "@/lib/api";

export async function GET() {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data, error } = await supabase
      .from("children")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) return jsonError(error.message, 400);
    return NextResponse.json({ children: data ?? [] });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
