import { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/logger";
import {
  getOffsetKey,
  getReminderScheduledAtWithOffset,
  normalizeReminderOffsets,
} from "@/lib/reminders";
import { FamilyMember, ReminderPreferences, ScheduleItem } from "@/lib/types";

/**
 * Ensures that pending notification_deliveries records exist for the given schedule items.
 * Should be called whenever schedule items are created or updated, or when preferences change.
 */
export async function ensurePendingNotifications(
  supabase: SupabaseClient,
  memberId: string,
  items: ScheduleItem[],
) {
  if (items.length === 0) return;

  const itemIds = items
    .map((item) => item.id)
    .filter((itemId): itemId is string => Boolean(itemId));

  if (itemIds.length === 0) return;

  // Remove stale pending deliveries first so updates to schedule date, status,
  // or preferences rebuild the queue instead of leaving outdated rows behind.
  const { error: deleteError } = await supabase
    .from("notification_deliveries")
    .delete()
    .eq("member_id", memberId)
    .eq("status", "pending")
    .in("member_vaccine_item_id", itemIds);

  if (deleteError) {
    logError("Failed to clear pending notifications", deleteError, { memberId, itemIds });
    return;
  }

  const [{ data: prefData }, { data: memberData }] = await Promise.all([
    supabase.from("reminder_preferences").select("*").eq("member_id", memberId).maybeSingle(),
    supabase.from("family_members").select("*").eq("id", memberId).single(),
  ]);

  if (!prefData || !memberData) return;

  const preferences = prefData as ReminderPreferences;
  const member = memberData as FamilyMember;

  if (!preferences.email_enabled || !preferences.reminder_email) {
    return;
  }

  type PendingDeliveryInsert = {
    member_id: string;
    member_vaccine_item_id: string;
    channel: "email";
    reminder_key: string;
    scheduled_for: string;
    status: "pending";
    payload: {
      member_name: string;
      vaccine_name: string;
    };
  };

  const deliveriesToUpsert: PendingDeliveryInsert[] = [];

  // Phase 2: Use reminder_offsets instead of hardcoded windows
  const offsets = normalizeReminderOffsets(preferences.reminder_offsets, preferences);

  for (const item of items) {
    if (item.status !== "planned" && item.status !== "overdue") continue;

    for (const offset of offsets) {
      const reminderKey = getOffsetKey(offset);
      const scheduledFor = getReminderScheduledAtWithOffset(
        item,
        preferences.timezone,
        offset,
      );

      deliveriesToUpsert.push({
        member_id: memberId,
        member_vaccine_item_id: item.id,
        channel: "email",
        reminder_key: reminderKey,
        scheduled_for: scheduledFor.toISO() ?? new Date().toISOString(),
        status: "pending",
        payload: {
          member_name: member.name,
          vaccine_name: item.vaccine_name,
        },
      });
    }
  }

  if (deliveriesToUpsert.length === 0) return;

  const { error } = await supabase
    .from("notification_deliveries")
    .upsert(deliveriesToUpsert, {
      onConflict: "member_vaccine_item_id,channel,reminder_key",
      ignoreDuplicates: true, // Don't overwrite if already sent or failed
    });

  if (error) {
    logError("Failed to ensure pending notifications", error, { memberId });
  }
}
