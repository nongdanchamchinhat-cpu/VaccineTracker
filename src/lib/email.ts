import { Resend } from "resend";

import { formatCurrency, formatDateTimeLabel, formatReminderLabel } from "@/lib/utils";
import { ReminderKey, ScheduleItem } from "@/lib/types";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  return new Resend(apiKey);
}

export function buildReminderEmailHtml({
  childName,
  timezone,
  items,
  reminderKey,
}: {
  childName: string;
  timezone: string;
  items: ScheduleItem[];
  reminderKey: ReminderKey;
}) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; color: #0f172a;">${item.vaccine_name}</div>
            <div style="color: #475569; font-size: 14px;">${formatDateTimeLabel(
              `${item.scheduled_date}T${item.appointment_time_local}`,
              timezone,
            )}</div>
            <div style="color: #64748b; font-size: 14px;">${item.disease}</div>
            <div style="color: #0f766e; font-size: 14px;">Chi phí dự kiến: ${formatCurrency(
              item.estimated_price,
            )}</div>
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family: system-ui, sans-serif; background: #f8fafc; padding: 32px;">
      <div style="max-width: 640px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0;">
        <div style="display: inline-block; background: #0f172a; color: white; padding: 8px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;">Nhắc lịch ${formatReminderLabel(
          reminderKey,
        )}</div>
        <h1 style="font-size: 28px; line-height: 1.2; margin: 16px 0 8px; color: #0f172a;">Lịch tiêm của ${childName}</h1>
        <p style="margin: 0 0 24px; color: #475569;">Các mũi dưới đây đang đến hạn nhắc. Lịch mẫu chỉ mang tính tham khảo, cần bác sĩ xác nhận trước khi tiêm.</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">${rows}</table>
      </div>
    </div>
  `;
}

export async function sendReminderEmail({
  to,
  childName,
  timezone,
  items,
  reminderKey,
}: {
  to: string;
  childName: string;
  timezone: string;
  items: ScheduleItem[];
  reminderKey: ReminderKey;
}) {
  const resend = getResendClient();
  const from = process.env.REMINDER_FROM_EMAIL ?? "Kobe Tracker <reminders@example.com>";

  return resend.emails.send({
    from,
    to,
    subject: `Nhắc lịch tiêm cho ${childName} (${formatReminderLabel(reminderKey)})`,
    html: buildReminderEmailHtml({
      childName,
      timezone,
      items,
      reminderKey,
    }),
  });
}
