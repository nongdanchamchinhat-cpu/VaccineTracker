import { DateTime } from "luxon";

import { ReminderKey, ReminderPreferences, ScheduleItem } from "@/lib/types";
import { DEFAULT_APPOINTMENT_TIME } from "@/lib/constants";

export const REMINDER_WINDOWS: Array<{
  key: ReminderKey;
  delta: { days?: number; hours?: number };
}> = [
  { key: "before_1_day", delta: { days: 1 } },
  { key: "before_2_hours", delta: { hours: 2 } },
];

export function getReminderScheduledAt(
  item: ScheduleItem,
  timezone: string,
  reminderKey: ReminderKey,
) {
  const appointment = DateTime.fromISO(
    `${item.scheduled_date}T${item.appointment_time_local || DEFAULT_APPOINTMENT_TIME}`,
    { zone: timezone },
  );

  if (reminderKey === "before_1_day") {
    return appointment.minus({ days: 1 }).toUTC();
  }

  return appointment.minus({ hours: 2 }).toUTC();
}

export function isReminderEnabled(
  preferences: ReminderPreferences,
  reminderKey: ReminderKey,
) {
  if (!preferences.email_enabled) return false;
  return reminderKey === "before_1_day"
    ? preferences.remind_one_day
    : preferences.remind_two_hours;
}
