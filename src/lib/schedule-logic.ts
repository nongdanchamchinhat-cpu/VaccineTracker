import { DateTime } from "luxon";

import { FamilyMember, ScheduleItem, ScheduleItemStatus, VaccineTemplate } from "@/lib/types";
import { DEFAULT_APPOINTMENT_TIME } from "@/lib/constants";

export type ShiftProposal = {
  targetId: string;
  targetDate: string;
  changes: Array<{
    id: string;
    vaccine_name: string;
    scheduled_date: string;
  }>;
};

export function deriveScheduleItemStatus(
  item: Pick<ScheduleItem, "status" | "scheduled_date">,
  timezone: string,
) {
  if (item.status !== "planned") {
    return item.status;
  }

  const today = DateTime.now().setZone(timezone).toISODate();
  if (today && item.scheduled_date < today) {
    return "overdue" as ScheduleItemStatus;
  }

  return item.status;
}

export function withDisplayStatus(items: ScheduleItem[], timezone: string) {
  return items.map((item) => ({
    ...item,
    status: deriveScheduleItemStatus(item, timezone),
  }));
}

export function sortScheduleItems(items: ScheduleItem[]) {
  return [...items].sort((left, right) => {
    if (left.scheduled_date !== right.scheduled_date) {
      return left.scheduled_date.localeCompare(right.scheduled_date);
    }

    return left.sort_order - right.sort_order;
  });
}

export function resolveTemplateBaseDate(member: FamilyMember) {
  const baseDateStr = ["infant", "child", "teen"].includes(member.member_type)
    ? member.birth_date
    : member.created_at;

  return DateTime.fromISO(baseDateStr);
}

export function buildScheduleDraftFromTemplates(
  member: FamilyMember,
  templates: VaccineTemplate[],
) {
  const baseDate = resolveTemplateBaseDate(member);

  return templates.map((template) => ({
    member_id: member.id,
    template_entry_id: template.id,
    sort_order: template.sort_order,
    scheduled_date: baseDate.plus({ days: template.recommended_age_days }).toISODate(),
    appointment_time_local: template.appointment_time_local || DEFAULT_APPOINTMENT_TIME,
    recommended_age_days: template.recommended_age_days,
    recommended_age_label: template.recommended_age_label,
    milestone: template.milestone,
    vaccine_name: template.vaccine_name,
    origin: template.origin,
    disease: template.disease,
    estimated_price: template.estimated_price,
    template_source: template.template_source,
    min_interval_days_from_prev: template.min_interval_days_from_prev,
    recurrence_rule: template.recurrence_rule,
  }));
}

function getFallbackIntervalDays(previous: ScheduleItem, current: ScheduleItem) {
  if (
    previous.recommended_age_days != null &&
    current.recommended_age_days != null &&
    current.recommended_age_days > previous.recommended_age_days
  ) {
    return current.recommended_age_days - previous.recommended_age_days;
  }

  return null;
}

export function proposeShiftedSchedule(
  targetItem: ScheduleItem,
  allItems: ScheduleItem[],
  newDate: string,
) {
  const sortedItems = sortScheduleItems(
    allItems.filter(
      (item) =>
        item.member_id === targetItem.member_id &&
        item.status !== "completed" &&
        item.status !== "skipped",
    ),
  );
  const targetIndex = sortedItems.findIndex((item) => item.id === targetItem.id);

  if (targetIndex === -1) {
    return {
      targetId: targetItem.id,
      targetDate: newDate,
      changes: [],
    } satisfies ShiftProposal;
  }

  let pivotDate = DateTime.fromISO(newDate);
  const changes: ShiftProposal["changes"] = [];

  for (let index = targetIndex + 1; index < sortedItems.length; index += 1) {
    const previousItem = index === targetIndex + 1 ? targetItem : sortedItems[index - 1];
    const item = sortedItems[index];
    const intervalDays =
      item.min_interval_days_from_prev ?? getFallbackIntervalDays(previousItem, item);

    if (!intervalDays) {
      const currentDate = DateTime.fromISO(item.scheduled_date);
      if (currentDate > pivotDate) {
        pivotDate = currentDate;
      }
      continue;
    }

    const minimumDate = pivotDate.plus({ days: intervalDays });
    const currentDate = DateTime.fromISO(item.scheduled_date);

    if (currentDate < minimumDate) {
      const nextDate = minimumDate.toISODate();
      if (nextDate) {
        changes.push({
          id: item.id,
          vaccine_name: item.vaccine_name,
          scheduled_date: nextDate,
        });
      }
      pivotDate = minimumDate;
      continue;
    }

    pivotDate = currentDate;
  }

  return {
    targetId: targetItem.id,
    targetDate: newDate,
    changes,
  } satisfies ShiftProposal;
}

export function getNextRecurringDate(item: Pick<ScheduleItem, "scheduled_date" | "recurrence_rule">) {
  if (!item.recurrence_rule) return null;

  const scheduledDate = DateTime.fromISO(item.scheduled_date);

  if (item.recurrence_rule.every_years) {
    return scheduledDate.plus({ years: item.recurrence_rule.every_years }).toISODate();
  }

  if (item.recurrence_rule.every_months) {
    return scheduledDate.plus({ months: item.recurrence_rule.every_months }).toISODate();
  }

  return null;
}
