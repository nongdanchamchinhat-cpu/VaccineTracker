import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics";
import { jsonError } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return jsonError("Token is required", 400);

    const supabase = await createServerSupabaseClient();
    
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Redirect to login if not logged in
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Find invite
    const { data: invite, error: inviteError } = await supabase
      .from("household_invites")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      return jsonError("Lời mời không hợp lệ hoặc đã hết hạn.", 400);
    }

    if (user.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return jsonError("Lời mời này thuộc về một email khác.", 403);
    }

    // 3. Add user to household
    const { error: membershipError } = await supabase
      .from("household_memberships")
      .upsert({
        household_id: invite.household_id,
        user_id: user.id,
        role: invite.role,
      }, { onConflict: "household_id,user_id" });

    if (membershipError) return jsonError(membershipError.message, 500);

    // 4. Delete used invite
    await supabase.from("household_invites").delete().eq("id", invite.id);

    trackEvent("household_invite_accepted", {
      userId: user.id,
      householdId: invite.household_id,
      role: invite.role,
    });

    // 5. Redirect to dashboard
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
