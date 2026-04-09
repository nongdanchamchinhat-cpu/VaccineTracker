"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createGuestChild,
  createGuestReminderPreference,
  createGuestScheduleFromTemplates,
  loadGuestStorage,
  saveGuestStorage,
} from "@/lib/guest-local";
import { generateCalendarICS } from "@/lib/ics";
import {
  ChildProfile,
  ReminderPreferences,
  ScheduleItem,
  ScheduleItemStatus,
} from "@/lib/types";
import {
  buildGoogleCalendarUrl,
  cn,
  computeProgress,
  formatCurrency,
  formatDateLabel,
  formatDateTimeLabel,
} from "@/lib/utils";
import { DEFAULT_APPOINTMENT_TIME, DEFAULT_TIMEZONE } from "@/lib/constants";

type FilterTab = "all" | "todo" | "done";

function getDefaultReminderPreferences(
  selectedChild: ChildProfile | null,
  existing: ReminderPreferences | null,
) {
  if (existing) return existing;

  return {
    id: "",
    child_id: selectedChild?.id ?? "",
    reminder_email: "",
    channel: "email",
    email_enabled: false,
    remind_one_day: true,
    remind_two_hours: true,
    timezone: selectedChild?.timezone ?? DEFAULT_TIMEZONE,
    created_at: "",
    updated_at: "",
  } satisfies ReminderPreferences;
}

export function GuestDashboardApp() {
  const [ready, setReady] = useState(false);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [allScheduleItems, setAllScheduleItems] = useState<ScheduleItem[]>([]);
  const [reminderPreferencesByChild, setReminderPreferencesByChild] = useState<
    Record<string, ReminderPreferences>
  >({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [addChildOpen, setAddChildOpen] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [reminderForm, setReminderForm] = useState<ReminderPreferences>(
    getDefaultReminderPreferences(null, null),
  );
  const [childForm, setChildForm] = useState({
    name: "",
    birthDate: "",
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
    setChildren(storage.children);
    setSelectedChildId(storage.selectedChildId);
    setAllScheduleItems(storage.scheduleItems);
    setReminderPreferencesByChild(storage.reminderPreferencesByChild);
    setAddChildOpen(storage.children.length === 0);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveGuestStorage({
      children,
      selectedChildId,
      scheduleItems: allScheduleItems,
      reminderPreferencesByChild,
    });
  }, [allScheduleItems, children, ready, reminderPreferencesByChild, selectedChildId]);

  const selectedChild =
    children.find((child) => child.id === selectedChildId) ?? children[0] ?? null;
  const scheduleItems = useMemo(
    () =>
      selectedChild
        ? allScheduleItems.filter((item) => item.child_id === selectedChild.id)
        : [],
    [allScheduleItems, selectedChild],
  );
  const reminderPreferences = selectedChild
    ? reminderPreferencesByChild[selectedChild.id] ?? null
    : null;

  useEffect(() => {
    setReminderForm(getDefaultReminderPreferences(selectedChild, reminderPreferences));
  }, [reminderPreferences, selectedChild]);

  const filteredItems = useMemo(() => {
    return scheduleItems.filter((item) => {
      const matchesSearch =
        item.vaccine_name.toLowerCase().includes(search.toLowerCase()) ||
        item.disease.toLowerCase().includes(search.toLowerCase()) ||
        item.milestone.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (tab === "todo") return item.status === "planned";
      if (tab === "done") return item.status === "completed";
      return true;
    });
  }, [scheduleItems, search, tab]);

  const completedItems = scheduleItems.filter((item) => item.status === "completed");
  const plannedItems = scheduleItems.filter((item) => item.status === "planned");
  const spent = completedItems.reduce(
    (acc, item) => acc + (item.actual_price ?? item.estimated_price ?? 0),
    0,
  );
  const projectedBudget = scheduleItems.reduce(
    (acc, item) => acc + (item.estimated_price ?? 0),
    0,
  );
  const progress = computeProgress(scheduleItems.length, completedItems.length);
  const topCalendarCandidates = plannedItems.slice(0, 3);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }

  function downloadCalendar() {
    if (!selectedChild) return;

    const ics = generateCalendarICS({
      childName: selectedChild.name,
      timezone: selectedChild.timezone,
      items: scheduleItems,
    });

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedChild.name}-schedule.ics`;
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

  function createChildHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!childForm.name || !childForm.birthDate) return;

    const child = createGuestChild({
      name: childForm.name,
      birthDate: childForm.birthDate,
      gender: childForm.gender || null,
    });
    const nextItems = createGuestScheduleFromTemplates(child);
    const nextPreference = createGuestReminderPreference(child);

    setChildren((current) => [...current, child]);
    setSelectedChildId(child.id);
    setAllScheduleItems((current) => [...current, ...nextItems]);
    setReminderPreferencesByChild((current) => ({
      ...current,
      [child.id]: nextPreference,
    }));
    setChildForm({ name: "", birthDate: "", gender: "" });
    setAddChildOpen(false);
    notify("Đã tạo hồ sơ bé và lưu vào local storage.");
  }

  function saveReminderPreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChild) return;

    const nextPreference: ReminderPreferences = {
      ...(reminderPreferencesByChild[selectedChild.id] ??
        createGuestReminderPreference(selectedChild)),
      reminder_email: reminderForm.reminder_email,
      email_enabled: reminderForm.email_enabled,
      remind_one_day: reminderForm.remind_one_day,
      remind_two_hours: reminderForm.remind_two_hours,
      timezone: reminderForm.timezone || selectedChild.timezone,
      updated_at: new Date().toISOString(),
    };

    setReminderPreferencesByChild((current) => ({
      ...current,
      [selectedChild.id]: nextPreference,
    }));
    notify("Đã lưu cài đặt reminder trong local storage.");
  }

  function createCustomItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChild) return;

    const now = new Date().toISOString();
    const item: ScheduleItem = {
      id: crypto.randomUUID(),
      child_id: selectedChild.id,
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
                Dùng ngay không cần đăng nhập. Dữ liệu sẽ lưu trong local storage.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Phù hợp khi phụ huynh muốn tạo lịch nhanh, quản lý nhiều bé trên cùng thiết bị và
                dùng Calendar để nhắc lịch. Đăng nhập chỉ cần khi muốn đồng bộ lên database.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
                Chế độ hiện tại
              </p>
              <div className="mt-3 text-lg font-bold">Khách / local storage</div>
              <p className="mt-2 text-sm text-slate-300">
                Không bắt buộc OTP. Dữ liệu chỉ lưu trên trình duyệt và thiết bị đang dùng.
              </p>
              <a
                href="/login"
                className="mt-6 inline-flex rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Đăng nhập để đồng bộ server
              </a>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">
                    Hồ sơ bé
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    {selectedChild ? selectedChild.name : "Tạo hồ sơ đầu tiên"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedChild
                      ? `Sinh ngày ${formatDateLabel(selectedChild.birth_date)} · múi giờ ${selectedChild.timezone}`
                      : "Có thể tạo nhiều hồ sơ bé ngay cả khi không đăng nhập."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                        child.id === selectedChild?.id
                          ? "bg-teal-700 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      {child.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setAddChildOpen((current) => !current)}
                    className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
                  >
                    {addChildOpen ? "Đóng form" : "Thêm bé"}
                  </button>
                </div>
              </div>

              {addChildOpen ? (
                <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={createChildHandler}>
                  <input
                    required
                    value={childForm.name}
                    onChange={(event) =>
                      setChildForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Tên bé"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                  />
                  <input
                    required
                    type="date"
                    value={childForm.birthDate}
                    onChange={(event) =>
                      setChildForm((current) => ({
                        ...current,
                        birthDate: event.target.value,
                      }))
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                  />
                  <select
                    value={childForm.gender}
                    onChange={(event) =>
                      setChildForm((current) => ({ ...current, gender: event.target.value }))
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
                    className="rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800"
                  >
                    Tạo hồ sơ và sinh lịch mẫu
                  </button>
                </form>
              ) : null}
            </div>

            {selectedChild ? (
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
                      {plannedItems.length}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Các mũi ở trạng thái planned.</p>
                  </div>
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Đã chi
                    </p>
                    <div className="mt-3 text-3xl font-black text-teal-700">
                      {formatCurrency(spent)}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Tính theo actual price nếu đã nhập.
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Dự kiến toàn lịch
                    </p>
                    <div className="mt-3 text-3xl font-black text-ink">
                      {formatCurrency(projectedBudget)}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Chi phí theo lịch mẫu và các mũi tự tạo.
                    </p>
                  </div>
                </div>

                <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-soft">
                  <p className="text-sm font-bold text-amber-900">Lưu ý y khoa</p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Lịch mẫu chỉ mang tính tham khảo cho phụ huynh Việt Nam. Quyết định tiêm,
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
                        Lịch của {selectedChild.name}
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
                              ? `Cần tiêm (${plannedItems.length})`
                              : `Đã tiêm (${completedItems.length})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Thêm mũi ngoài lịch mẫu</p>
                      <p className="text-sm text-slate-500">
                        Dùng khi bác sĩ chỉ định thêm, đổi hoặc nhập lịch cũ.
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
                        placeholder="Nhãn tuổi gợi ý"
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
                                    : "Planned"}
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
                                    childName: selectedChild.name,
                                    timezone: selectedChild.timezone,
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
                                <option value="planned">planned</option>
                                <option value="completed">completed</option>
                                <option value="skipped">skipped</option>
                              </select>
                              <textarea
                                name="notes"
                                defaultValue={item.notes ?? ""}
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
            <form
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft"
              onSubmit={saveReminderPreferences}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Reminder settings
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Nhắc lịch miễn phí</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Với guest mode, nhắc lịch phù hợp nhất là lưu vào Calendar của người dùng. Không
                cần OTP, không cần email server, không cần domain.
              </p>

              <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950">
                <p className="font-semibold">Cách dùng ngay</p>
                <p className="mt-1">
                  Tải file calendar cho cả bé, rồi import vào Google Calendar, Apple Calendar hoặc
                  Outlook. File `.ics` đã có nhắc trước 1 ngày và trước 2 giờ.
                </p>
                {selectedChild ? (
                  <button
                    type="button"
                    onClick={downloadCalendar}
                    className="mt-4 inline-flex rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800"
                  >
                    Tải calendar của {selectedChild.name}
                  </button>
                ) : null}
              </div>

              {selectedChild && topCalendarCandidates.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Thêm nhanh từng mũi vào Google Calendar
                  </p>
                  <div className="mt-3 space-y-3">
                    {topCalendarCandidates.map((item) => (
                      <a
                        key={item.id}
                        href={buildGoogleCalendarUrl({
                          childName: selectedChild.name,
                          timezone: selectedChild.timezone,
                          item,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-teal-300 hover:bg-teal-50"
                      >
                        <div className="text-sm font-semibold text-slate-900">{item.vaccine_name}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {formatDateTimeLabel(
                            `${item.scheduled_date}T${item.appointment_time_local}`,
                            selectedChild.timezone,
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Email nhận nhắc</span>
                  <input
                    type="email"
                    value={reminderForm.reminder_email ?? ""}
                    onChange={(event) =>
                      setReminderForm((current) => ({
                        ...current,
                        reminder_email: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-700">Bật email nhắc lịch</span>
                  <input
                    type="checkbox"
                    checked={reminderForm.email_enabled}
                    onChange={(event) =>
                      setReminderForm((current) => ({
                        ...current,
                        email_enabled: event.target.checked,
                      }))
                    }
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-700">Nhắc trước 1 ngày</span>
                  <input
                    type="checkbox"
                    checked={reminderForm.remind_one_day}
                    onChange={(event) =>
                      setReminderForm((current) => ({
                        ...current,
                        remind_one_day: event.target.checked,
                      }))
                    }
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-700">Nhắc trước 2 giờ</span>
                  <input
                    type="checkbox"
                    checked={reminderForm.remind_two_hours}
                    onChange={(event) =>
                      setReminderForm((current) => ({
                        ...current,
                        remind_two_hours: event.target.checked,
                      }))
                    }
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={!selectedChild}
                className="mt-6 w-full rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Lưu cài đặt reminder
              </button>
            </form>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Mức triển khai
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Không đăng nhập vẫn tạo được nhiều hồ sơ bé.</li>
                <li>Dữ liệu guest chỉ lưu trong local storage của trình duyệt này.</li>
                <li>Calendar `.ics` là đường nhắc lịch miễn phí mặc định.</li>
                <li>
                  Nếu muốn đồng bộ lên database và dùng OTP, vào <a className="text-teal-700 underline" href="/login">/login</a>.
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>

      {toast ? (
        <div className="fixed bottom-5 right-5 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-soft">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
