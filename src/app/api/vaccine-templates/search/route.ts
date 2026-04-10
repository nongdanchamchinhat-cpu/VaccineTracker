import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json({ templates: [] });
    }

    const { data, error } = await supabase
      .from("vaccine_templates")
      .select("*")
      .or(`vaccine_name.ilike.%${query}%,disease.ilike.%${query}%`)
      .limit(10);

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ templates: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
