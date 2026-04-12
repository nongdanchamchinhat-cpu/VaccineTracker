import { DateTime } from "luxon";

import { ReminderOffset, ReminderPreferences, ScheduleItem } from "@/lib/types";
import { DEFAULT_APPOINTMENT_TIME } from "@/lib/constants";

export const DEFAULT_REMINDER_OFFSETS: ReminderOffset[] = [{ days: 1 }, { hours: 2 }];

export function getOffsetKey(offset: ReminderOffset): string {
  if (offset.days) return `before_${offset.days}_day`;
  if (offset.hours) return `before_${offset.hours}_hour`;
  if (offset.minutes) return `before_${offset.minutes}_minute`;
  return "custom_offset";
}

export function getReminderScheduledAtWithOffset(
  item: ScheduleItem,
  timezone: string,
  offset: ReminderOffset,
) {
  const appointment = DateTime.fromISO(
    `${item.scheduled_date}T${item.appointment_time_local || DEFAULT_APPOINTMENT_TIME}`,
    { zone: timezone },
  );

  return appointment.minus(offset).toUTC();
}

export function normalizeReminderOffsets(
  offsets: ReminderOffset[] | null | undefined,
  preferences?: Pick<ReminderPreferences, "remind_one_day" | "remind_two_hours">,
) {
  if (offsets && offsets.length > 0) {
    return offsets;
  }

  if (preferences) {
    const derived: ReminderOffset[] = [];
    if (preferences.remind_one_day) derived.push({ days: 1 });
    if (preferences.remind_two_hours) derived.push({ hours: 2 });
    return derived;
  }

  return DEFAULT_REMINDER_OFFSETS;
}
