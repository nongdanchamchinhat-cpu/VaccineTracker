"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FamilyMember, ReminderPreferences } from "@/lib/types";

interface ReminderSettingsFormProps {
  selectedMember: FamilyMember;
  reminderPreferences: ReminderPreferences;
  onNotify: (msg: string) => void;
  disabled?: boolean;
}

export function ReminderSettingsForm({
  selectedMember,
  reminderPreferences,
  onNotify,
  disabled = false,
}: ReminderSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(reminderPreferences);

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/me/reminder-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: selectedMember.id,
        reminder_email: form.reminder_email,
        email_enabled: form.email_enabled,
        remind_one_day: form.remind_one_day,
        remind_two_hours: form.remind_two_hours,
        timezone: form.timezone || selectedMember.timezone,
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      onNotify(payload.error ?? "Không thể lưu cài đặt nhắc lịch.");
      return;
    }

    onNotify("Đã cập nhật cài đặt nhắc lịch.");
    router.refresh();
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">
        Cài đặt nhắc lịch
      </p>
      <form className="mt-6 space-y-4" onSubmit={savePreferences}>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Email nhận thông báo
          </label>
          <input
            required
            type="email"
            value={form.reminder_email || ""}
            onChange={(e) => setForm({ ...form, reminder_email: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
           <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
            <input
              type="checkbox"
              checked={form.remind_one_day}
              onChange={(e) => setForm({ ...form, remind_one_day: e.target.checked })}
              disabled={disabled}
              className="h-5 w-5 rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-slate-700">Nhắc trước 1 ngày</span>
          </label>
           <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
            <input
              type="checkbox"
              checked={form.remind_two_hours}
              onChange={(e) => setForm({ ...form, remind_two_hours: e.target.checked })}
              disabled={disabled}
              className="h-5 w-5 rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-slate-700">Nhắc trước 2 giờ</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800"
        >
          {disabled ? "Chế độ chỉ xem" : "Lưu cài đặt"}
        </button>
      </form>
    </div>
  );
}
