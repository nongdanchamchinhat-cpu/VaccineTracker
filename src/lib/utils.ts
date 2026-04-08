import { DateTime } from "luxon";
import clsx from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "Chưa có";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateVN(dateISO: string) {
  return DateTime.fromISO(dateISO).setLocale("vi").toFormat("dd/MM/yyyy");
}

export function formatDateLabel(dateISO: string) {
  return DateTime.fromISO(dateISO)
    .setLocale("vi")
    .toFormat("ccc, dd/MM/yyyy");
}

export function formatDateTimeLabel(dateISO: string, timezone: string) {
  return DateTime.fromISO(dateISO, { zone: "utc" })
    .setZone(timezone)
    .setLocale("vi")
    .toFormat("ccc, dd/MM/yyyy 'lúc' HH:mm");
}

export function buildAppointmentDateTime(
  scheduledDate: string,
  appointmentTimeLocal: string,
  timezone: string,
) {
  return DateTime.fromISO(`${scheduledDate}T${appointmentTimeLocal}`, {
    zone: timezone,
  });
}

export function toUtcISOString(
  scheduledDate: string,
  appointmentTimeLocal: string,
  timezone: string,
) {
  return buildAppointmentDateTime(
    scheduledDate,
    appointmentTimeLocal,
    timezone,
  ).toUTC().toISO();
}

export function computeProgress(
  totalCount: number,
  completedCount: number,
) {
  if (totalCount === 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
}

export function formatReminderLabel(reminderKey: string) {
  return reminderKey === "before_1_day" ? "trước 1 ngày" : "trước 2 giờ";
}
