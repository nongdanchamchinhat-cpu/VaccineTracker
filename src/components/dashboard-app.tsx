"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  ChildProfile,
  DashboardBootstrapData,
  ReminderPreferences,
  ScheduleItem,
  ScheduleItemStatus,
} from "@/lib/types";
import {
  cn,
  computeProgress,
  formatCurrency,
  formatDateLabel,
} from "@/lib/utils";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

type FilterTab = "all" | "todo" | "done";

function getDefaultReminderPreferences(
  selectedChild: ChildProfile | null,
  existing: ReminderPreferences | null,
  fallbackEmail: string,
): ReminderPreferences {
  if (existing) return existing;

  return {
    id: "",
    child_id: selectedChild?.id ?? "",
    reminder_email: fallbackEmail,
    channel: "email",
    email_enabled: true,
    remind_one_day: true,
    remind_two_hours: true,
    timezone: selectedChild?.timezone ?? DEFAULT_TIMEZONE,
    created_at: "",
    updated_at: "",
  };
}

export function DashboardApp({
  bootstrap,
}: {
  bootstrap: DashboardBootstrapData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [addChildOpen, setAddChildOpen] = useState(bootstrap.children.length === 0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [reminderForm, setReminderForm] = useState(() =>
    getDefaultReminderPreferences(
      bootstrap.selectedChild,
      bootstrap.reminderPreferences,
      bootstrap.userEmail,
    ),
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

  const selectedChild = bootstrap.selectedChild;
  const scheduleItems = bootstrap.scheduleItems;

  useEffect(() => {
    setReminderForm(
      getDefaultReminderPreferences(
        bootstrap.selectedChild,
        bootstrap.reminderPreferences,
        bootstrap.userEmail,
      ),
    );
  }, [bootstrap.reminderPreferences, bootstrap.selectedChild, bootstrap.userEmail]);

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

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  async function createChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!childForm.name || !childForm.birthDate) return;

    const createResponse = await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: childForm.name,
        birth_date: childForm.birthDate,
        gender: childForm.gender || null,
      }),
    });

    const createPayload = (await createResponse.json()) as { error?: string; child?: ChildProfile };
    if (!createResponse.ok || !createPayload.child) {
      notify(createPayload.error ?? "Không thể tạo hồ sơ bé.");
      return;
    }

    const scheduleResponse = await fetch(
      `/api/children/${createPayload.child.id}/schedule/from-template`,
      {
        method: "POST",
      },
    );

    const schedulePayload = (await scheduleResponse.json()) as { error?: string };
    if (!scheduleResponse.ok) {
      notify(schedulePayload.error ?? "Không thể khởi tạo lịch mẫu.");
      return;
    }

    setChildForm({ name: "", birthDate: "", gender: "" });
    setAddChildOpen(false);
    notify("Đã tạo hồ sơ bé và khởi tạo lịch mẫu.");
    startTransition(() => {
      router.push(`/?childId=${createPayload.child?.id}`);
      router.refresh();
    });
  }

  async function saveReminderPreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChild) return;

    const response = await fetch("/api/me/reminder-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId: selectedChild.id,
        reminder_email: reminderForm.reminder_email,
        email_enabled: reminderForm.email_enabled,
        remind_one_day: reminderForm.remind_one_day,
        remind_two_hours: reminderForm.remind_two_hours,
        timezone: reminderForm.timezone || selectedChild.timezone,
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      notify(payload.error ?? "Không thể lưu cài đặt nhắc lịch.");
      return;
    }

    notify("Đã cập nhật cài đặt nhắc lịch.");
    startTransition(() => router.refresh());
  }

  async function createCustomItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChild) return;

    const response = await fetch("/api/schedule-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child_id: selectedChild.id,
        vaccine_name: customForm.vaccine_name,
        disease: customForm.disease,
        origin: customForm.origin,
        estimated_price: customForm.estimated_price
          ? Number(customForm.estimated_price)
          : null,
        scheduled_date: customForm.scheduled_date,
        milestone: customForm.milestone,
        recommended_age_label: customForm.recommended_age_label,
        notes: customForm.notes || null,
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      notify(payload.error ?? "Không thể thêm mũi tuỳ chỉnh.");
      return;
    }

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
    setCustomFormOpen(false);
    notify("Đã thêm mũi tuỳ chỉnh.");
    startTransition(() => router.refresh());
  }

  async function quickComplete(item: ScheduleItem) {
    const response = await fetch(`/api/schedule-items/${item.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actual_price: item.actual_price ?? item.estimated_price ?? null,
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      notify(payload.error ?? "Không thể cập nhật trạng thái mũi.");
      return;
    }

    notify(`Đã đánh dấu "${item.vaccine_name}" là đã tiêm.`);
    startTransition(() => router.refresh());
  }

  async function updateItem(
    itemId: string,
    nextStatus: ScheduleItemStatus,
    formData: FormData,
  ) {
    const response = await fetch(`/api/schedule-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      notify(payload.error ?? "Không thể cập nhật mũi tiêm.");
      return;
    }

    setEditingItemId(null);
    notify("Đã lưu thay đổi.");
    startTransition(() => router.refresh());
  }

  const reminderEmailValue = reminderForm.reminder_email ?? bootstrap.userEmail;

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[32px] bg-ink text-white shadow-soft">
          <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.4fr_0.9fr] md:px-8">
            <div>
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-teal-100">
                Multi-user vaccine tracker
              </div>
              <h1 className="mt-6 text-3xl font-black leading-tight md:text-5xl">
                Quản lý lịch tiêm cho cả gia đình, không còn phụ thuộc `localStorage`.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Mỗi tài khoản có thể quản lý nhiều bé, tạo lịch từ mẫu Việt Nam, chỉnh tay
                từng mũi và nhận email nhắc thật qua hệ thống cron.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
                Tài khoản
              </p>
              <div className="mt-3 text-lg font-bold">{bootstrap.userEmail}</div>
              <p className="mt-2 text-sm text-slate-300">
                Đăng nhập bằng OTP email qua Supabase Auth.
              </p>
              <button
                onClick={signOut}
                className="mt-6 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Đăng xuất
              </button>
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
                      : "Tạo bé đầu tiên để hệ thống sinh lịch tiêm chuẩn từ ngày sinh."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {bootstrap.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        startTransition(() => {
                          router.push(`/?childId=${child.id}`);
                          router.refresh();
                        });
                      }}
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
                <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={createChild}>
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
                    disabled={isPending}
                    className="rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isPending ? "Đang khởi tạo..." : "Tạo hồ sơ và sinh lịch mẫu"}
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
                    <p className="mt-2 text-sm text-slate-500">
                      Các mũi ở trạng thái planned.
                    </p>
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
                  <p className="text-sm font-bold text-amber-900">
                    Lưu ý y khoa
                  </p>
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
                    <a
                      href={`/api/children/${selectedChild.id}/calendar.ics`}
                      className="rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slateWarm"
                    >
                      Tải file Calendar (.ics)
                    </a>
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
                            tab === filter
                              ? "bg-white text-teal-700 shadow"
                              : "text-slate-600",
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
                      <p className="text-sm font-semibold text-slate-800">
                        Thêm mũi ngoài lịch mẫu
                      </p>
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
                          setCustomForm((current) => ({
                            ...current,
                            disease: event.target.value,
                          }))
                        }
                        placeholder="Bệnh phòng ngừa"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                      />
                      <input
                        required
                        value={customForm.origin}
                        onChange={(event) =>
                          setCustomForm((current) => ({
                            ...current,
                            origin: event.target.value,
                          }))
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
                          setCustomForm((current) => ({
                            ...current,
                            milestone: event.target.value,
                          }))
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
                          setCustomForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
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
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {item.disease}
                              </p>
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
                              onSubmit={async (event) => {
                                event.preventDefault();
                                const formData = new FormData(event.currentTarget);
                                const nextStatus = String(formData.get("status")) as ScheduleItemStatus;
                                await updateItem(item.id, nextStatus, formData);
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
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                Email nhắc lịch
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Vercel Cron sẽ quét các mũi đến hạn và gửi email thật qua Resend.
              </p>

              <div className="mt-6 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Email nhận nhắc</span>
                  <input
                    type="email"
                    value={reminderEmailValue}
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
                <li>OTP email qua Supabase Auth.</li>
                <li>Dữ liệu lịch và trạng thái nằm trên Postgres.</li>
                <li>Email nhắc thật qua Resend và cron 15 phút.</li>
                <li>ICS export theo từng hồ sơ bé.</li>
                <li>Sẵn đường nâng cấp cho multi-child và clinic mode.</li>
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
