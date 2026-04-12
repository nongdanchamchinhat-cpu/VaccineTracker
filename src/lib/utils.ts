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
  const match = reminderKey.match(/^before_(\d+)_(day|hour|minute)s?$/);
  if (!match) {
    return reminderKey.replaceAll("_", " ");
  }

  const [, value, unit] = match;
  if (unit === "day") return `trước ${value} ngày`;
  if (unit === "hour") return `trước ${value} giờ`;
  return `trước ${value} phút`;
}

export function buildGoogleCalendarUrl({
  memberName,
  timezone,
  item,
}: {
  memberName: string;
  timezone: string;
  item: {
    id: string;
    scheduled_date: string;
    appointment_time_local: string;
    vaccine_name: string;
    milestone: string;
    disease: string;
    origin: string;
    estimated_price: number | null;
  };
}) {
  const start = buildAppointmentDateTime(
    item.scheduled_date,
    item.appointment_time_local,
    timezone,
  );
  const end = start.plus({ hours: 1 });
  const details = [
    `Moc: ${item.milestone}`,
    `Benh phong ngua: ${item.disease}`,
    `Xuat xu: ${item.origin}`,
    `Chi phi du kien: ${item.estimated_price ?? 0} VND`,
    "Lich nay chi mang tinh tham khao, can bac si xac nhan truoc khi tiem.",
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Tiem chung cho ${memberName}: ${item.vaccine_name}`,
    dates: `${start.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'")}/${end.toUTC().toFormat(
      "yyyyLLdd'T'HHmmss'Z'",
    )}`,
    details,
    location: "VNVC / Long Chau / Co so tiem chung cua ban",
    ctz: timezone,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
