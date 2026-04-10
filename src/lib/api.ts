import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (error.message === "Auth session missing!") {
      return { supabase, user: null };
    }
    throw error;
  }

  if (!user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}
