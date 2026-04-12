import { Resend } from "resend";

import { formatCurrency, formatDateTimeLabel, formatReminderLabel } from "@/lib/utils";
import { ScheduleItem } from "@/lib/types";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  return new Resend(apiKey);
}

export function buildReminderEmailHtml({
  memberName,
  timezone,
  items,
  reminderKey,
}: {
  memberName: string;
  timezone: string;
  items: ScheduleItem[];
  reminderKey: string;
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
        <h1 style="font-size: 28px; line-height: 1.2; margin: 16px 0 8px; color: #0f172a;">Lịch tiêm của ${memberName}</h1>
        <p style="margin: 0 0 24px; color: #475569;">Các mũi dưới đây đang đến hạn nhắc. Lịch mẫu chỉ mang tính tham khảo, cần bác sĩ xác nhận trước khi tiêm.</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">${rows}</table>
      </div>
    </div>
  `;
}

export async function sendReminderEmail({
  to,
  memberName,
  timezone,
  items,
  reminderKey,
}: {
  to: string;
  memberName: string;
  timezone: string;
  items: ScheduleItem[];
  reminderKey: string;
}) {
  const resend = getResendClient();
  const from = process.env.REMINDER_FROM_EMAIL ?? "Family Vaccine Tracker <reminders@example.com>";

  return resend.emails.send({
    from,
    to,
    subject: `Nhắc lịch tiêm cho ${memberName} (${formatReminderLabel(reminderKey)})`,
    html: buildReminderEmailHtml({
      memberName,
      timezone,
      items,
      reminderKey,
    }),
  });
}

export async function sendHouseholdInviteEmail({
  to,
  inviterEmail,
  householdName,
  role,
  inviteUrl,
}: {
  to: string;
  inviterEmail: string;
  householdName: string;
  role: string;
  inviteUrl: string;
}) {
  const resend = getResendClient();
  const from = process.env.REMINDER_FROM_EMAIL ?? "Family Vaccine Tracker <reminders@example.com>";

  return resend.emails.send({
    from,
    to,
    subject: `Lời mời tham gia ${householdName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; background: #f8fafc; padding: 32px;">
        <div style="max-width: 640px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0;">
          <div style="display: inline-block; background: #0f172a; color: white; padding: 8px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;">Family Sharing</div>
          <h1 style="font-size: 28px; line-height: 1.2; margin: 16px 0 8px; color: #0f172a;">Bạn được mời vào ${householdName}</h1>
          <p style="margin: 0 0 12px; color: #475569;">${inviterEmail} đã mời bạn tham gia household với quyền <strong>${role}</strong>.</p>
          <p style="margin: 0 0 24px; color: #475569;">Bấm nút dưới đây để đăng nhập và chấp nhận lời mời.</p>
          <a href="${inviteUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:16px;font-weight:700;">Chấp nhận lời mời</a>
          <p style="margin: 24px 0 0; color: #64748b; font-size: 13px;">Nếu bạn không mong đợi email này, có thể bỏ qua.</p>
        </div>
      </div>
    `,
  });
}
