import { NextRequest, NextResponse } from "next/server";

import { logError, logInfo } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email";
import {
  FamilyMember,
  NotificationDelivery,
  ReminderPreferences,
  ScheduleItem,
} from "@/lib/types";

function isCronAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!process.env.RESEND_API_KEY || !process.env.REMINDER_FROM_EMAIL) {
      logInfo("Cron reminders skipped because email provider is not configured");
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "email_provider_not_configured",
      });
    }

    const admin = createAdminSupabaseClient();
    const nowIso = new Date().toISOString();

    const { data: deliveriesData, error: deliveriesError } = await admin
      .from("notification_deliveries")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true });

    if (deliveriesError) throw deliveriesError;

    const dueDeliveries = (deliveriesData ?? []) as NotificationDelivery[];

    if (dueDeliveries.length === 0) {
      return NextResponse.json({
        ok: true,
        inspectedMembers: 0,
        inspectedDeliveries: 0,
        sentGroups: 0,
      });
    }

    const memberIds = [...new Set(dueDeliveries.map((delivery) => delivery.member_id))];
    const itemIds = [...new Set(dueDeliveries.map((delivery) => delivery.member_vaccine_item_id))];

    const [
      { data: preferencesData, error: preferencesError },
      { data: membersData, error: membersError },
      { data: itemsData, error: itemsError },
    ] = await Promise.all([
      admin
        .from("reminder_preferences")
        .select("*")
        .in("member_id", memberIds)
        .eq("email_enabled", true),
      admin.from("family_members").select("*").in("id", memberIds),
      admin
        .from("member_vaccine_items")
        .select("*")
        .in("id", itemIds)
        .eq("status", "planned"),
    ]);

    if (preferencesError) throw preferencesError;
    if (membersError) throw membersError;
    if (itemsError) throw itemsError;

    const preferenceByMemberId = new Map(
      ((preferencesData ?? []) as ReminderPreferences[]).map((preference) => [
        preference.member_id,
        preference,
      ]),
    );
    const memberById = new Map(
      ((membersData ?? []) as FamilyMember[]).map((member) => [member.id, member]),
    );
    const itemById = new Map(
      ((itemsData ?? []) as ScheduleItem[]).map((item) => [item.id, item]),
    );

    let sentGroups = 0;
    const groupedDeliveries = new Map<
      string,
      {
        member: FamilyMember;
        preference: ReminderPreferences;
        reminderKey: string;
        deliveries: NotificationDelivery[];
        items: ScheduleItem[];
      }
    >();
    const staleDeliveryIds: string[] = [];

    for (const delivery of dueDeliveries) {
      const preference = preferenceByMemberId.get(delivery.member_id);
      const member = memberById.get(delivery.member_id);
      const item = itemById.get(delivery.member_vaccine_item_id);

      if (
        !preference ||
        !member ||
        !item ||
        !preference.reminder_email
      ) {
        staleDeliveryIds.push(delivery.id);
        continue;
      }

      const groupKey = `${delivery.member_id}:${delivery.reminder_key}`;
      const existingGroup = groupedDeliveries.get(groupKey);

      if (existingGroup) {
        existingGroup.deliveries.push(delivery);
        existingGroup.items.push(item);
        continue;
      }

      groupedDeliveries.set(groupKey, {
        member,
        preference,
        reminderKey: delivery.reminder_key,
        deliveries: [delivery],
        items: [item],
      });
    }

    if (staleDeliveryIds.length > 0) {
      const { error: staleUpdateError } = await admin
        .from("notification_deliveries")
        .update({
          status: "failed",
          error_message: "stale_delivery",
        })
        .in("id", staleDeliveryIds)
        .eq("status", "pending");

      if (staleUpdateError) {
        logError("Failed to mark stale reminder deliveries", staleUpdateError, {
          deliveryIds: staleDeliveryIds,
        });
      }
    }

    for (const group of groupedDeliveries.values()) {
      group.items.sort((left, right) => {
        if (left.scheduled_date !== right.scheduled_date) {
          return left.scheduled_date.localeCompare(right.scheduled_date);
        }

        return left.sort_order - right.sort_order;
      });

      try {
        const sendResult = await sendReminderEmail({
          to: group.preference.reminder_email!,
          memberName: group.member.name,
          timezone: group.preference.timezone,
          items: group.items,
          reminderKey: group.reminderKey,
        });

        const { error: sentUpdateError } = await admin
          .from("notification_deliveries")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            provider_message_id: sendResult.data?.id ?? null,
            error_message: null,
          })
          .in(
            "id",
            group.deliveries.map((delivery) => delivery.id),
          )
          .eq("status", "pending");

        if (sentUpdateError) {
          throw sentUpdateError;
        }

        sentGroups += 1;
        logInfo("Reminder email sent", {
          memberId: group.member.id,
          reminderKey: group.reminderKey,
          items: group.items.length,
        });
      } catch (error) {
        const { error: failedUpdateError } = await admin
          .from("notification_deliveries")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .in(
            "id",
            group.deliveries.map((delivery) => delivery.id),
          )
          .eq("status", "pending");

        if (failedUpdateError) {
          logError("Failed to mark reminder deliveries as failed", failedUpdateError, {
            memberId: group.member.id,
            reminderKey: group.reminderKey,
          });
        }

        logError("Reminder email failed", error, {
          memberId: group.member.id,
          reminderKey: group.reminderKey,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      inspectedMembers: memberIds.length,
      inspectedDeliveries: dueDeliveries.length,
      sentGroups,
    });
  } catch (error) {
    logError("Cron reminders failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
