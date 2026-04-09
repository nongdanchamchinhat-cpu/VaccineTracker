import { DateTime } from "luxon";
import { NextRequest, NextResponse } from "next/server";

import { logError, logInfo } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email";
import { getReminderScheduledAt, isReminderEnabled, REMINDER_WINDOWS } from "@/lib/reminders";
import { ChildProfile, ReminderPreferences, ReminderKey, ScheduleItem } from "@/lib/types";

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
    const now = DateTime.utc();
    const windowStart = now.minus({ minutes: 15 });

    const { data: preferencesData, error: preferencesError } = await admin
      .from("reminder_preferences")
      .select("*, children(*)")
      .eq("email_enabled", true);

    if (preferencesError) {
      throw preferencesError;
    }

    let sentGroups = 0;
    const inspectedChildren = (preferencesData ?? []).length;

    for (const record of preferencesData ?? []) {
      const preference = record as ReminderPreferences & { children: ChildProfile };
      const child = preference.children;

      const { data: itemsData, error: itemsError } = await admin
        .from("child_vaccine_items")
        .select("*")
        .eq("child_id", child.id)
        .eq("status", "planned")
        .gte("scheduled_date", now.minus({ days: 1 }).toISODate())
        .lte("scheduled_date", now.plus({ days: 2 }).toISODate())
        .order("scheduled_date", { ascending: true });

      if (itemsError) {
        throw itemsError;
      }

      const items = (itemsData ?? []) as ScheduleItem[];

      for (const window of REMINDER_WINDOWS) {
        if (!isReminderEnabled(preference, window.key)) continue;
        if (!preference.reminder_email) continue;

        const dueItems = items.filter((item) => {
          const dueAt = getReminderScheduledAt(item, preference.timezone, window.key);
          return dueAt <= now && dueAt > windowStart;
        });

        if (dueItems.length === 0) continue;

        const claimedDeliveries: Array<{ id: string; item: ScheduleItem }> = [];

        for (const item of dueItems) {
          const scheduledFor = getReminderScheduledAt(
            item,
            preference.timezone,
            window.key,
          ).toISO();

          const { data: inserted, error: insertError } = await admin
            .from("notification_deliveries")
            .upsert(
              {
                child_id: child.id,
                child_vaccine_item_id: item.id,
                channel: "email",
                reminder_key: window.key,
                scheduled_for: scheduledFor,
                status: "pending",
                payload: {
                  child_name: child.name,
                  vaccine_name: item.vaccine_name,
                },
              },
              {
                onConflict: "child_vaccine_item_id,channel,reminder_key",
                ignoreDuplicates: true,
              },
            )
            .select("id")
            .maybeSingle();

          if (insertError) {
            logError("Failed to claim reminder delivery", insertError, {
              childId: child.id,
              scheduleItemId: item.id,
              reminderKey: window.key,
            });
            continue;
          }

          if (inserted?.id) {
            claimedDeliveries.push({ id: inserted.id, item });
          }
        }

        if (claimedDeliveries.length === 0) continue;

        try {
          const sendResult = await sendReminderEmail({
            to: preference.reminder_email,
            childName: child.name,
            timezone: preference.timezone,
            items: claimedDeliveries.map((delivery) => delivery.item),
            reminderKey: window.key as ReminderKey,
          });

          for (const delivery of claimedDeliveries) {
            await admin
              .from("notification_deliveries")
              .update({
                status: "sent",
                sent_at: new Date().toISOString(),
                provider_message_id: sendResult.data?.id ?? null,
              })
              .eq("id", delivery.id);
          }

          sentGroups += 1;
          logInfo("Reminder email sent", {
            childId: child.id,
            reminderKey: window.key,
            items: claimedDeliveries.length,
          });
        } catch (error) {
          for (const delivery of claimedDeliveries) {
            await admin
              .from("notification_deliveries")
              .update({
                status: "failed",
                error_message: error instanceof Error ? error.message : "Unknown error",
              })
              .eq("id", delivery.id);
          }

          logError("Reminder email failed", error, {
            childId: child.id,
            reminderKey: window.key,
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      inspectedChildren,
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
