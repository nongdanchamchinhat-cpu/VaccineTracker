import { SupabaseClient } from "@supabase/supabase-js";

export async function logAuditEvent(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null = null,
  metadata: Record<string, unknown> = {}
) {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });

    if (error) {
      console.error("[Audit Log Failed]", error.message);
    }
  } catch (err) {
    console.error("[Audit Log Exception]", err);
  }
}
