import { jsonError, requireAuthenticatedUser } from "@/lib/api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE() {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return jsonError("Unauthorized", 401);

    const { data: memberships, error: membershipsError } = await supabase
      .from("household_memberships")
      .select("*")
      .eq("user_id", user.id);

    if (membershipsError) return jsonError(membershipsError.message, 400);

    const ownerHouseholdIds = (memberships ?? [])
      .filter((membership) => membership.role === "owner")
      .map((membership) => membership.household_id);

    if (ownerHouseholdIds.length > 0) {
      const { data: otherMembers, error: otherMembersError } = await supabase
        .from("household_memberships")
        .select("household_id,user_id")
        .in("household_id", ownerHouseholdIds)
        .neq("user_id", user.id);

      if (otherMembersError) return jsonError(otherMembersError.message, 400);
      if ((otherMembers ?? []).length > 0) {
        return jsonError(
          "Bạn đang là owner của household có người khác tham gia. Hãy gỡ hoặc chuyển quyền trước khi xoá tài khoản.",
          409,
        );
      }

      await supabase.from("family_members").delete().in("household_id", ownerHouseholdIds);
      await supabase.from("household_invites").delete().in("household_id", ownerHouseholdIds);
      await supabase.from("households").delete().in("id", ownerHouseholdIds);
    }

    await supabase.from("household_invites").delete().eq("email", user.email ?? "");
    await supabase.from("household_memberships").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    const admin = createAdminSupabaseClient();
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) return jsonError(deleteUserError.message, 500);

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
