import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics";
import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { sendHouseholdInviteEmail } from "@/lib/email";
import { HouseholdInvite } from "@/lib/types";

const schema = z.object({
  household_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]).default("editor"),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const body = schema.parse(await request.json());
    const normalizedEmail = body.email.toLowerCase();

    const { data: membership, error: membershipError } = await supabase
      .from("household_memberships")
      .select("role")
      .eq("household_id", body.household_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) return jsonError(membershipError.message, 400);
    if (!membership || membership.role !== "owner") {
      return jsonError("Chỉ chủ sở hữu household mới có thể gửi lời mời.", 403);
    }

    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id, name")
      .eq("id", body.household_id)
      .single();

    if (householdError || !household) {
      return jsonError("Không tìm thấy household.", 404);
    }

    const { data: existingInvite, error: existingInviteError } = await supabase
      .from("household_invites")
      .select("*")
      .eq("household_id", body.household_id)
      .eq("email", normalizedEmail)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingInviteError) {
      return jsonError(existingInviteError.message, 400);
    }

    let invite = existingInvite as HouseholdInvite | null;
    if (!invite) {
      const { data: createdInvite, error: inviteError } = await supabase
        .from("household_invites")
        .insert({
          household_id: body.household_id,
          inviter_id: user.id,
          email: normalizedEmail,
          role: body.role,
        })
        .select("*")
        .single();

      if (inviteError || !createdInvite) {
        return jsonError(inviteError?.message ?? "Không thể tạo lời mời.", 500);
      }

      invite = createdInvite as HouseholdInvite;
    }

    const inviteUrl = new URL("/api/households/invites/accept", request.url);
    inviteUrl.searchParams.set("token", invite.token);

    let emailSent = false;
    if (process.env.RESEND_API_KEY && process.env.REMINDER_FROM_EMAIL && user.email) {
      await sendHouseholdInviteEmail({
        to: normalizedEmail,
        inviterEmail: user.email,
        householdName: household.name,
        role: body.role,
        inviteUrl: inviteUrl.toString(),
      });
      emailSent = true;
    }

    trackEvent("household_invite_created", {
      userId: user.id,
      householdId: body.household_id,
      inviteeEmail: normalizedEmail,
      role: body.role,
    });

    return NextResponse.json({
      invite,
      inviteUrl: inviteUrl.toString(),
      emailSent,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
