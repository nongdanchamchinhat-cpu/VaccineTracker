"use client";

import { DateTime } from "luxon";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createGuestMember,
  createGuestReminderPreference,
  createGuestScheduleFromTemplates,
  loadGuestStorage,
  saveGuestStorage,
} from "@/lib/guest-local";
import { generateCalendarICS } from "@/lib/ics";
import {
  FamilyMember,
  ReminderPreferences,
  ScheduleItem,
  ScheduleItemStatus,
  MemberType,
} from "@/lib/types";
import {
  buildGoogleCalendarUrl,
  cn,
  computeProgress,
  formatCurrency,
  formatDateLabel,
} from "@/lib/utils";
import { DEFAULT_APPOINTMENT_TIME, DEFAULT_TIMEZONE } from "@/lib/constants";
import { normalizeReminderOffsets } from "@/lib/reminders";

type FilterTab = "all" | "todo" | "done";

const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  infant: "Sơ sinh",
  child: "Trẻ em",
  teen: "Thiếu niên",
  adult: "Người lớn",
  senior: "Cao tuổi",
  pregnant: "Mang thai",
};

const MEMBER_TYPE_ICONS: Record<MemberType, string> = {
  infant: "👶",
  child: "🧒",
  teen: "🧑‍🎓",
  adult: "👩‍💼",
  senior: "👵",
  pregnant: "🤰",
};

function getDefaultReminderPreferences(
  selectedMember: FamilyMember | null,
  existing: ReminderPreferences | null,
) {
  if (existing) {
    return {
      ...existing,
      reminder_offsets: normalizeReminderOffsets(existing.reminder_offsets, existing),
    };
  }

  return {
    id: "",
    member_id: selectedMember?.id ?? "",
    reminder_email: "",
    channel: "email",
    email_enabled: false,
    remind_one_day: true,
    remind_two_hours: true,
    reminder_offsets: normalizeReminderOffsets(undefined, {
      remind_one_day: true,
      remind_two_hours: true,
    }),
    timezone: selectedMember?.timezone ?? DEFAULT_TIMEZONE,
    created_at: "",
    updated_at: "",
  } satisfies ReminderPreferences;
}

export function GuestDashboardApp() {
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [allScheduleItems, setAllScheduleItems] = useState<ScheduleItem[]>([]);
  const [reminderPreferencesByMember, setReminderPreferencesByMember] = useState<
    Record<string, ReminderPreferences>
  >({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [memberSettingsOpen, setMemberSettingsOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState<ReminderPreferences>(
    getDefaultReminderPreferences(null, null),
  );
  const [memberForm, setMemberForm] = useState({
    name: "",
    birthDate: "",
    memberType: "infant" as MemberType,
    gender: "",
  });
  const [customForm, setCustomForm] = useState({
    vaccine_name: "",
    disease: "",
    origin: "",
    estimated_price: "",
    scheduled_date: "",
    milestone: "Mũi tự tạo",
    recommended_age_label: "Tuỳ chỉnh",
    notes: "",
  });

  useEffect(() => {
    const storage = loadGuestStorage();
    setMembers(storage.members);
    setSelectedMemberId(storage.selectedMemberId);
    setAllScheduleItems(storage.scheduleItems);
    setReminderPreferencesByMember(storage.reminderPreferencesByMember);
    setAddMemberOpen(storage.members.length === 0);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveGuestStorage({
      members,
      selectedMemberId,
      scheduleItems: allScheduleItems,
      reminderPreferencesByMember,
    });
  }, [allScheduleItems, members, ready, reminderPreferencesByMember, selectedMemberId]);

  const selectedMember =
    members.find((m) => m.id === selectedMemberId) ?? members[0] ?? null;
  const scheduleItems = useMemo(
    () =>
      selectedMember
        ? allScheduleItems.filter((item) => item.member_id === selectedMember.id)
        : [],
    [allScheduleItems, selectedMember],
  );
  const reminderPreferences = selectedMember
    ? reminderPreferencesByMember[selectedMember.id] ?? null
    : null;

  useEffect(() => {
    setReminderForm(getDefaultReminderPreferences(selectedMember, reminderPreferences));
  }, [reminderPreferences, selectedMember]);

  const filteredItems = useMemo(() => {
    return scheduleItems.filter((item) => {
      const matchesSearch =
        item.vaccine_name.toLowerCase().includes(search.toLowerCase()) ||
        item.disease.toLowerCase().includes(search.toLowerCase()) ||
        item.milestone.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (tab === "todo") return item.status === "planned" || item.status === "overdue";
      if (tab === "done") return item.status === "completed";
      return true;
    });
  }, [scheduleItems, search, tab]);

  const completedItems = scheduleItems.filter((item) => item.status === "completed");
  const todoItems = scheduleItems.filter((item) => item.status === "planned" || item.status === "overdue");
  const spent = completedItems.reduce(
    (acc, item) => acc + (item.actual_price ?? item.estimated_price ?? 0),
    0,
  );
  const projectedBudget = scheduleItems.reduce(
    (acc, item) => acc + (item.estimated_price ?? 0),
    0,
  );
  const progress = computeProgress(scheduleItems.length, completedItems.length);
  const topCalendarCandidates = todoItems.slice(0, 3);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }

  function downloadCalendar() {
    if (!selectedMember) return;

    const ics = generateCalendarICS({
      memberName: selectedMember.name,
      timezone: selectedMember.timezone,
      items: scheduleItems,
    });

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedMember.name}-schedule.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetCustomForm() {
    setCustomForm({
      vaccine_name: "",
      disease: "",
      origin: "",
      estimated_price: "",
      scheduled_date: "",
      milestone: "Mũi tự tạo",
      recommended_age_label: "Tuỳ chỉnh",
      notes: "",
    });
  }

  function createMemberHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memberForm.name || !memberForm.birthDate) return;

    const member = createGuestMember({
      name: memberForm.name,
      birthDate: memberForm.birthDate,
      memberType: memberForm.memberType,
      gender: memberForm.gender || null,
    });
    const nextItems = createGuestScheduleFromTemplates(member);
    const nextPreference = createGuestReminderPreference(member);

    setMembers((current) => [...current, member]);
    setSelectedMemberId(member.id);
    setAllScheduleItems((current) => [...current, ...nextItems]);
    setReminderPreferencesByMember((current) => ({
      ...current,
      [member.id]: nextPreference,
    }));
    setMemberForm({ name: "", birthDate: "", memberType: "infant", gender: "" });
    setAddMemberOpen(false);
    notify("Đã tạo hồ sơ thành viên và lưu vào local storage.");
  }

  // ── Chỉnh sửa hồ sơ (không chạm vào createMemberHandler) ─────────────────
  function handleUpdateMember(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("edit_name") || "").trim();
    const memberType = formData.get("edit_memberType") as MemberType;
    const gender = String(formData.get("edit_gender") || "") || null;
    if (!name) return;

    setMembers((current) =>
      current.map((m) =>
        m.id === id
          ? { ...m, name, member_type: memberType, gender, updated_at: new Date().toISOString() }
          : m,
      ),
    );
    setMemberSettingsOpen(false);
    notify("Đã cập nhật hồ sơ thành viên.");
  }

  // ── Xóa hồ sơ (không chạm vào createMemberHandler) ───────────────────────
  function handleDeleteMember(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    if (!window.confirm(`Xóa hồ sơ "${member.name}" và toàn bộ lịch tiêm liên quan? Hành động này không thể hoàn tác.`)) return;

    setMembers((current) => current.filter((m) => m.id !== id));
    setAllScheduleItems((current) => current.filter((item) => item.member_id !== id));
    setReminderPreferencesByMember((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    if (selectedMemberId === id) {
      setSelectedMemberId(members.find((m) => m.id !== id)?.id ?? null);
    }
    setMemberSettingsOpen(false);
    notify(`Đã xóa hồ sơ "${member.name}".`);
  }

  function saveReminderPreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMember) return;

    const nextPreference: ReminderPreferences = {
      ...(reminderPreferencesByMember[selectedMember.id] ??
        createGuestReminderPreference(selectedMember)),
      reminder_email: reminderForm.reminder_email,
      email_enabled: reminderForm.email_enabled,
      remind_one_day: reminderForm.remind_one_day,
      remind_two_hours: reminderForm.remind_two_hours,
      reminder_offsets: normalizeReminderOffsets(undefined, {
        remind_one_day: reminderForm.remind_one_day,
        remind_two_hours: reminderForm.remind_two_hours,
      }),
      timezone: reminderForm.timezone || selectedMember.timezone,
      updated_at: new Date().toISOString(),
    };

    setReminderPreferencesByMember((current) => ({
      ...current,
      [selectedMember.id]: nextPreference,
    }));
    notify("Đã lưu cài đặt reminder trong local storage.");
  }

  function createCustomItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMember) return;

    const now = new Date().toISOString();
    const item: ScheduleItem = {
      id: crypto.randomUUID(),
      member_id: selectedMember.id,
      template_entry_id: null,
      sort_order: 9000,
      scheduled_date: customForm.scheduled_date,
      appointment_time_local: DEFAULT_APPOINTMENT_TIME,
      recommended_age_days: null,
      recommended_age_label: customForm.recommended_age_label,
      milestone: customForm.milestone,
      vaccine_name: customForm.vaccine_name,
      origin: customForm.origin,
      disease: customForm.disease,
      estimated_price: customForm.estimated_price ? Number(customForm.estimated_price) : null,
      actual_price: null,
      notes: customForm.notes || null,
      status: "planned",
      template_source: "custom",
      min_interval_days_from_prev: null,
      recurrence_rule: null,
      lot_number: null,
      photo_url: null,
      adverse_reactions: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };

    setAllScheduleItems((current) => [...current, item]);
    resetCustomForm();
    setCustomFormOpen(false);
    notify("Đã thêm mũi tuỳ chỉnh vào local storage.");
  }

  function quickComplete(item: ScheduleItem) {
    setAllScheduleItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
            ...entry,
            status: "completed",
            actual_price: entry.actual_price ?? entry.estimated_price ?? null,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          : entry,
      ),
    );
    notify(`Đã đánh dấu "${item.vaccine_name}" là đã tiêm.`);
  }

  function updateItem(itemId: string, nextStatus: ScheduleItemStatus, formData: FormData) {
    setAllScheduleItems((current) =>
      current.map((entry) =>
        entry.id === itemId
          ? {
            ...entry,
            status: nextStatus,
            scheduled_date: String(formData.get("scheduled_date") || ""),
            estimated_price: formData.get("estimated_price")
              ? Number(formData.get("estimated_price"))
              : null,
            actual_price: formData.get("actual_price")
              ? Number(formData.get("actual_price"))
              : null,
            vaccine_name: String(formData.get("vaccine_name") || ""),
            disease: String(formData.get("disease") || ""),
            origin: String(formData.get("origin") || ""),
            notes: String(formData.get("notes") || "") || null,
            completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          }
          : entry,
      ),
    );
    setEditingItemId(null);
    notify("Đã lưu thay đổi trong local storage.");
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[32px] bg-ink text-white shadow-soft">
          <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.4fr_0.9fr] md:px-8">
            <div>
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-teal-100">
                Guest mode
              </div>
              <h1 className="mt-6 text-3xl font-black leading-tight md:text-5xl">
                <span className="md:hidden">Lịch tiêm gia đình</span>
                <span className="hidden md:inline">Quản lý lịch tiêm cho cả gia đình, nhanh chóng và miễn phí.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                <span className="md:hidden">Dữ liệu lưu tại trình duyệt, không cần tạo tài khoản.</span>
                <span className="hidden md:inline">
                  Dữ liệu được lưu trực tiếp trên trình duyệt của bạn. Phù hợp khi muốn quản lý ngay
                  lịch tiêm cho con cái, cha mẹ mà không cần tạo tài khoản.
                </span>
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
                Chế độ hiện tại
              </p>
              <div className="mt-3 text-lg font-bold">Khách / Local Storage</div>
              <p className="mt-2 text-sm text-slate-300">
                Dữ liệu chỉ lưu trên trình duyệt và thiết bị này.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Đăng nhập để đồng bộ server
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">
                    Thành viên gia đình
                  </p>
                  <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-slate-900">
                    {selectedMember ? (
                      <>
                        <span>{MEMBER_TYPE_ICONS[selectedMember.member_type]}</span>
                        <span>{selectedMember.name}</span>
                      </>
                    ) : (
                      "Tạo hồ sơ đầu tiên"
                    )}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedMember
                      ? `${MEMBER_TYPE_LABELS[selectedMember.member_type]} · Sinh ngày ${formatDateLabel(selectedMember.birth_date)}`
                      : "Tạo hồ sơ thành viên để bắt đầu quản lý lịch tiêm chủng."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                        member.id === selectedMember?.id
                          ? "bg-teal-700 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      {MEMBER_TYPE_ICONS[member.member_type]} {member.name} · {MEMBER_TYPE_LABELS[member.member_type]}
                    </button>
                  ))}
                  <button
                    onClick={() => setAddMemberOpen((current) => !current)}
                    className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
                  >
                    {addMemberOpen ? "Đóng form" : "Thêm thành viên"}
                  </button>
                  {selectedMember && (
                    <button
                      title="Chỉnh sửa / xóa hồ sơ"
                      onClick={() => {
                        setMemberSettingsOpen((v) => !v);
                        setAddMemberOpen(false);
                      }}
                      className={cn(
                        "rounded-full border p-2 transition",
                        memberSettingsOpen
                          ? "border-teal-300 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Panel chỉnh sửa / xóa hồ sơ ──────────────────────── */}
              {memberSettingsOpen && selectedMember && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                    Chỉnh sửa hồ sơ: {selectedMember.name}
                  </p>
                  <form
                    className="grid gap-3 md:grid-cols-2"
                    onSubmit={(e) => handleUpdateMember(selectedMember.id, e)}
                  >
                    <div className="flex flex-col gap-1">
                      <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tên</label>
                      <input
                        required
                        name="edit_name"
                        defaultValue={selectedMember.name}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Loại thành viên</label>
                      <select
                        name="edit_memberType"
                        defaultValue={selectedMember.member_type}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
                      >
                        {Object.entries(MEMBER_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {MEMBER_TYPE_ICONS[value as MemberType]} {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Giới tính</label>
                      <select
                        name="edit_gender"
                        defaultValue={selectedMember.gender || ""}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
                      >
                        <option value="">Chưa xác định</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800"
                      >
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>

                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
                    <div>
                      <p className="text-xs font-bold text-rose-900">Xóa hồ sơ này</p>
                      <p className="text-[11px] text-rose-600">Xóa vĩnh viễn khỏi trình duyệt, không thể hoàn tác.</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMember(selectedMember.id)}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
                    >
                      Xóa hồ sơ
                    </button>
                  </div>
                </div>
              )}

              {addMemberOpen ? (
                <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={createMemberHandler}>
                  <input
                    required
                    value={memberForm.name}
                    onChange={(event) =>
                      setMemberForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Tên thành viên"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                  />
                  <input
                    required
                    type="date"
                    value={memberForm.birthDate}
                    onChange={(event) =>
                      setMemberForm((current) => ({
                        ...current,
                        birthDate: event.target.value,
                      }))
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                  />
                  <select
                    required
                    value={memberForm.memberType}
                    onChange={(event) =>
                      setMemberForm((current) => ({ ...current, memberType: event.target.value as MemberType }))
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                  >
                    {Object.entries(MEMBER_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{MEMBER_TYPE_ICONS[value as MemberType]} {label}</option>
                    ))}
                  </select>
                  <select
                    value={memberForm.gender}
                    onChange={(event) =>
                      setMemberForm((current) => ({ ...current, gender: event.target.value }))
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                  >
                    <option value="">Giới tính (tuỳ chọn)</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 md:col-span-2"
                  >
                    Tạo hồ sơ và sinh lịch mẫu
                  </button>
                </form>
              ) : null}
            </div>

            {selectedMember ? (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Tiến độ
                    </p>
                    <div className="mt-3 text-4xl font-black text-ink">{progress}%</div>
                    <p className="mt-2 text-sm text-slate-500">
                      {completedItems.length}/{scheduleItems.length} mũi đã hoàn tất.
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Còn phải tiêm
                    </p>
                    <div className="mt-3 text-4xl font-black text-amber-600">
                      {todoItems.length}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Các mũi đang ở trạng thái sắp tiêm.
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Đã chi
                    </p>
                    <div className="mt-3 text-xl font-black text-teal-700 break-all leading-tight">
                      {formatCurrency(spent)}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Tính thực tế nếu có.
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Tổng dự kiến
                    </p>
                    <div className="mt-3 text-xl font-black text-ink break-all leading-tight">
                      {formatCurrency(projectedBudget)}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Theo lịch mẫu & tự tạo.
                    </p>
                  </div>
                </div>

                <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-soft">
                  <p className="text-sm font-bold text-amber-900">Lưu ý y khoa</p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Lịch mẫu chỉ mang tính tham khảo. Quyết định tiêm,
                    lùi lịch hay bỏ mũi phải được bác sĩ hoặc cơ sở tiêm chủng xác nhận.
                  </p>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                        Timeline mũi tiêm
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-slate-900">
                        Lịch của {selectedMember.name}
                      </h3>
                    </div>
                    <button
                      onClick={downloadCalendar}
                      className="rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slateWarm"
                    >
                      Tải file Calendar (.ics)
                    </button>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 md:flex-row">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Tìm theo tên mũi, bệnh hoặc mốc"
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                    />
                    <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      {(["all", "todo", "done"] as FilterTab[]).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setTab(filter)}
                          className={cn(
                            "rounded-xl px-4 py-2 text-sm font-semibold transition",
                            tab === filter ? "bg-white text-teal-700 shadow" : "text-slate-600",
                          )}
                        >
                          {filter === "all"
                            ? `Tất cả (${scheduleItems.length})`
                            : filter === "todo"
                              ? `Cần tiêm (${todoItems.length})`
                              : `Đã tiêm (${completedItems.length})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Thêm mũi ngoài lịch mẫu</p>
                      <p className="text-sm text-slate-500">
                        Dùng khi bác sĩ chỉ định thêm hoặc nhập lịch cũ.
                      </p>
                    </div>
                    <button
                      onClick={() => setCustomFormOpen((current) => !current)}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
                    >
                      {customFormOpen ? "Đóng form" : "Thêm mũi"}
                    </button>
                  </div>

                  {customFormOpen ? (
                    <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={createCustomItem}>
                      <input
                        required
                        value={customForm.vaccine_name}
                        onChange={(event) =>
                          setCustomForm((current) => ({
                            ...current,
                            vaccine_name: event.target.value,
                          }))
                        }
                        placeholder="Tên vaccine"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                      />
                      <input
                        required
                        type="date"
                        value={customForm.scheduled_date}
                        onChange={(event) =>
                          setCustomForm((current) => ({
                            ...current,
                            scheduled_date: event.target.value,
                          }))
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                      />
                      <input
                        required
                        value={customForm.disease}
                        onChange={(event) =>
                          setCustomForm((current) => ({ ...current, disease: event.target.value }))
                        }
                        placeholder="Bệnh phòng ngừa"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                      />
                      <input
                        required
                        value={customForm.origin}
                        onChange={(event) =>
                          setCustomForm((current) => ({ ...current, origin: event.target.value }))
                        }
                        placeholder="Xuất xứ"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                      />
                      <input
                        value={customForm.estimated_price}
                        onChange={(event) =>
                          setCustomForm((current) => ({
                            ...current,
                            estimated_price: event.target.value,
                          }))
                        }
                        placeholder="Chi phí dự kiến"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                      />
                      <input
                        value={customForm.milestone}
                        onChange={(event) =>
                          setCustomForm((current) => ({ ...current, milestone: event.target.value }))
                        }
                        placeholder="Mốc hiển thị"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                      />
                      <input
                        value={customForm.recommended_age_label}
                        onChange={(event) =>
                          setCustomForm((current) => ({
                            ...current,
                            recommended_age_label: event.target.value,
                          }))
                        }
                        placeholder="Nhãn gợi ý"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                      />
                      <textarea
                        value={customForm.notes}
                        onChange={(event) =>
                          setCustomForm((current) => ({ ...current, notes: event.target.value }))
                        }
                        placeholder="Ghi chú"
                        className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white md:col-span-2"
                      />
                      <button
                        type="submit"
                        className="rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 md:col-span-2"
                      >
                        Lưu mũi tuỳ chỉnh
                      </button>
                    </form>
                  ) : null}

                  <div className="mt-6 space-y-4">
                    {filteredItems.map((item) => {
                      const isEditing = editingItemId === item.id;
                      return (
                        <article
                          key={item.id}
                          className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                                {item.milestone}
                              </div>
                              <h4 className="mt-3 text-xl font-black text-slate-900">
                                {item.vaccine_name}
                              </h4>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{item.disease}</p>
                              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
                                <span className="rounded-full bg-white px-3 py-1">
                                  {formatDateLabel(item.scheduled_date)}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1">
                                  {item.recommended_age_label}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1">
                                  {item.origin}
                                </span>
                              </div>
                            </div>

                            <div className="min-w-[220px]">
                              <div
                                className={cn(
                                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]",
                                  item.status === "completed"
                                    ? "bg-teal-100 text-teal-800"
                                    : item.status === "skipped"
                                      ? "bg-slate-200 text-slate-700"
                                      : "bg-amber-100 text-amber-800",
                                )}
                              >
                                {item.status === "completed"
                                  ? "Đã tiêm"
                                  : item.status === "skipped"
                                    ? "Bỏ qua"
                                    : "Sắp tiêm"}
                              </div>
                              <div className="mt-3 text-sm text-slate-500">
                                Dự kiến: {formatCurrency(item.estimated_price)}
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                Thực tế: {formatCurrency(item.actual_price)}
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <a
                                  href={buildGoogleCalendarUrl({
                                    memberName: selectedMember.name,
                                    timezone: selectedMember.timezone,
                                    item,
                                  })}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
                                >
                                  Google Calendar
                                </a>
                                {item.status !== "completed" ? (
                                  <button
                                    onClick={() => quickComplete(item)}
                                    className="rounded-2xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                                  >
                                    Đã tiêm
                                  </button>
                                ) : null}
                                <button
                                  onClick={() =>
                                    setEditingItemId((current) =>
                                      current === item.id ? null : item.id,
                                    )
                                  }
                                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
                                >
                                  {isEditing ? "Đóng sửa" : "Sửa chi tiết"}
                                </button>
                              </div>
                            </div>
                          </div>

                          {isEditing ? (
                            <form
                              className="mt-5 grid gap-3 border-t border-slate-200 pt-5 md:grid-cols-2"
                              onSubmit={(event) => {
                                event.preventDefault();
                                const formData = new FormData(event.currentTarget);
                                const nextStatus = String(formData.get("status")) as ScheduleItemStatus;
                                updateItem(item.id, nextStatus, formData);
                              }}
                            >
                              <input
                                name="vaccine_name"
                                defaultValue={item.vaccine_name}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
                              />
                              <input
                                name="scheduled_date"
                                type="date"
                                defaultValue={item.scheduled_date}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
                              />
                              <input
                                name="disease"
                                defaultValue={item.disease}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
                              />
                              <input
                                name="origin"
                                defaultValue={item.origin}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
                              />
                              <input
                                name="estimated_price"
                                type="number"
                                defaultValue={item.estimated_price ?? ""}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
                              />
                              <input
                                name="actual_price"
                                type="number"
                                defaultValue={item.actual_price ?? ""}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
                              />
                              <select
                                name="status"
                                defaultValue={item.status}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
                              >
                                <option value="planned">Sắp tiêm</option>
                                <option value="completed">Đã tiêm</option>
                                <option value="skipped">Bỏ qua</option>
                              </select>
                              <textarea
                                name="notes"
                                defaultValue={item.notes ?? ""}
                                placeholder="Ghi chú cá nhân"
                                className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500 md:col-span-2"
                              />
                              <button
                                type="submit"
                                className="rounded-2xl bg-ink px-4 py-3 font-semibold text-white transition hover:bg-slateWarm md:col-span-2"
                              >
                                Lưu thay đổi mũi
                              </button>
                            </form>
                          ) : null}
                        </article>
                      );
                    })}

                    {filteredItems.length === 0 ? (
                      <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        Không có mũi nào khớp với bộ lọc hiện tại.
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
                Lịch trình sắp tới
              </p>
              <div className="mt-6 space-y-6">
                {topCalendarCandidates.length > 0 ? (
                  topCalendarCandidates.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                        <span className="text-sm font-bold">
                          {DateTime.fromISO(item.scheduled_date).day}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{item.vaccine_name}</p>
                        <p className="text-sm text-slate-500">
                          {formatDateLabel(item.scheduled_date)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Không có mũi tiêm nào sắp tới.</p>
                )}
              </div>

              {selectedMember && (
                <button
                  onClick={downloadCalendar}
                  className="mt-8 block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Đồng bộ toàn bộ lịch (.ics)
                </button>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
                Nhắc lịch qua Email
              </p>
              <div className="mt-4 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                ⚠️ Chế độ Khách chỉ hỗ trợ lưu cài đặt cơ bản. Email thật chỉ được gửi trong chế độ
                đồng bộ DB (Đã đăng nhập).
              </div>
              <form className="mt-6 space-y-4" onSubmit={saveReminderPreferences}>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Email nhận tin
                  </label>
                  <input
                    type="email"
                    required
                    value={reminderForm.reminder_email ?? ""}
                    onChange={(event) =>
                      setReminderForm((current) => ({
                        ...current,
                        reminder_email: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-bold">Bật nhắc lịch</p>
                    <p className="text-xs text-slate-500">Chỉ hoạt động khi đăng nhập</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setReminderForm((current) => ({
                        ...current,
                        email_enabled: !current.email_enabled,
                      }))
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      reminderForm.email_enabled ? "bg-teal-600" : "bg-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        reminderForm.email_enabled ? "translate-x-5" : "translate-x-0",
                      )}
                    />
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="remind_one_day"
                      checked={reminderForm.remind_one_day}
                      onChange={(event) =>
                        setReminderForm((current) => ({
                          ...current,
                          remind_one_day: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="remind_one_day" className="text-sm text-slate-700">
                      Nhắc trước 1 ngày
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="remind_two_hours"
                      checked={reminderForm.remind_two_hours}
                      onChange={(event) =>
                        setReminderForm((current) => ({
                          ...current,
                          remind_two_hours: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="remind_two_hours" className="text-sm text-slate-700">
                      Nhắc trước 2 giờ
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800"
                >
                  Lưu cài đặt local
                </button>
              </form>
            </div>
          </aside>
        </section>
      </div>

      {toast ? (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white shadow-2xl">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
