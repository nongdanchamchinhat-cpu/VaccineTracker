import { DateTime } from "luxon";

import { ScheduleItem } from "@/lib/types";
import { DEFAULT_APPOINTMENT_TIME } from "@/lib/constants";

function escapeICS(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function formatICSDate(dateTime: DateTime) {
  return dateTime.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
}

export function generateCalendarICS({
  memberName,
  timezone,
  items,
}: {
  memberName: string;
  timezone: string;
  items: ScheduleItem[];
}) {
  const events = items
    .filter((item) => item.status !== "skipped")
    .map((item) => {
      const start = DateTime.fromISO(
        `${item.scheduled_date}T${item.appointment_time_local || DEFAULT_APPOINTMENT_TIME}`,
        { zone: timezone },
      );
      const end = start.plus({ hours: 1 });

      return [
        "BEGIN:VEVENT",
        `UID:${item.id}@family-vaccine-tracker`,
        `DTSTAMP:${formatICSDate(DateTime.utc())}`,
        `DTSTART:${formatICSDate(start)}`,
        `DTEND:${formatICSDate(end)}`,
        `SUMMARY:${escapeICS(`Tiêm chủng cho ${memberName}: ${item.vaccine_name}`)}`,
        `DESCRIPTION:${escapeICS(
          `Mốc: ${item.milestone}\nBệnh phòng ngừa: ${item.disease}\nXuất xứ: ${item.origin}\nChi phí dự kiến: ${item.estimated_price ?? 0} VND\nLưu ý: Cần bác sĩ xác nhận trước khi tiêm.`,
        )}`,
        "LOCATION:VNVC / Long Châu / Cơ sở tiêm chủng của bạn",
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeICS(`Nhắc lịch tiêm cho ${memberName} vào ngày mai`)}`,
        "END:VALARM",
        "BEGIN:VALARM",
        "TRIGGER:-PT2H",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeICS(`Lịch tiêm cho ${memberName} trong 2 giờ nữa`)}`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\n");
    })
    .join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FamilyVaccineTracker//MultiTenant//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(`Lịch tiêm chủng của ${memberName}`)}`,
    `X-WR-TIMEZONE:${timezone}`,
    events,
    "END:VCALENDAR",
  ].join("\n");
}
