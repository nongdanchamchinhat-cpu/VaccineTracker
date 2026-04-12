"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  DashboardBootstrapData,
  ReminderPreferences,
} from "@/lib/types";
import { cn, computeProgress } from "@/lib/utils";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

// Sub-components
import { StatsOverview } from "./dashboard/stats-overview";
import { MemberSelector } from "./dashboard/member-selector";
import { CustomItemForm } from "./dashboard/custom-item-form";
import { TimelineItem } from "./dashboard/timeline-item";
import { HouseholdManager } from "./dashboard/household-manager";
import { ReminderSettingsForm } from "./dashboard/reminder-settings-form";
import { AccountManager } from "./dashboard/account-manager";
import { CalendarView } from "./dashboard/calendar-view";
import { UpcomingWidget } from "./dashboard/upcoming-widget";

type FilterTab = "all" | "todo" | "overdue" | "done";
type ViewMode = "timeline" | "calendar";

function getDefaultReminderPreferences(
  selectedMemberId: string | undefined,
  existing: ReminderPreferences | null,
  fallbackEmail: string,
): ReminderPreferences {
  if (existing) return existing;

  return {
    id: "",
    member_id: selectedMemberId ?? "",
    reminder_email: fallbackEmail,
    channel: "email",
    email_enabled: true,
    remind_one_day: true,
    remind_two_hours: true,
    reminder_offsets: [{ days: 1 }, { hours: 2 }],
    timezone: DEFAULT_TIMEZONE,
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
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [toast, setToast] = useState<string | null>(null);
  const [shiftProposal, setShiftProposal] = useState<{
    targetId: string;
    newDate: string;
    changes: Array<{ id: string; vaccine_name: string; scheduled_date: string }>;
  } | null>(null);

  const selectedMember = bootstrap.selectedMember;
  const scheduleItems = bootstrap.scheduleItems;
  const selectedMembership = selectedMember
    ? bootstrap.householdMemberships.find(
        (membership) => membership.household_id === selectedMember.household_id,
      ) ?? null
    : bootstrap.householdMemberships[0] ?? null;
  const canEditSelectedMember = selectedMembership ? selectedMembership.role !== "viewer" : false;

  const filteredItems = useMemo(() => {
    return scheduleItems.filter((item) => {
      const matchesSearch =
        item.vaccine_name.toLowerCase().includes(search.toLowerCase()) ||
        item.disease.toLowerCase().includes(search.toLowerCase()) ||
        item.milestone.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (tab === "todo") return item.status === "planned" || item.status === "overdue";
      if (tab === "overdue") return item.status === "overdue";
      if (tab === "done") return item.status === "completed";
      return true;
    });
  }, [scheduleItems, search, tab]);

  const completedItems = scheduleItems.filter((item) => item.status === "completed");
  const plannedItems = scheduleItems.filter((item) => item.status === "planned" || item.status === "overdue");
  const overdueItemsCount = scheduleItems.filter((item) => item.status === "overdue").length;
  const progress = computeProgress(scheduleItems.length, completedItems.length);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  async function handleShiftProposal(itemId: string, newDate: string) {
    const resp = await fetch(`/api/schedule-items/${itemId}/shift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_date: newDate }),
    });
    if (resp.ok) {
      const payload = await resp.json();
      if (payload.changes && payload.changes.length > 0) {
        setShiftProposal({
          targetId: itemId,
          newDate: newDate,
          changes: payload.changes,
        });
      } else {
        // No shifts needed, save normally
        await finalizeUpdate(itemId, newDate, false);
      }
    }
  }

  async function finalizeUpdate(itemId: string, newDate: string, confirmedShift: boolean) {
    const item = scheduleItems.find(i => i.id === itemId);
    if (!item) return;

    const response = await fetch(`/api/schedule-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        scheduled_date: newDate,
      }),
    });

    if (response.ok && confirmedShift && shiftProposal) {
      for (const change of shiftProposal.changes) {
        const cItem = scheduleItems.find(i => i.id === change.id);
        if (!cItem) continue;
        await fetch(`/api/schedule-items/${change.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...cItem, scheduled_date: change.scheduled_date }),
        });
      }
    }

    setShiftProposal(null);
    notify("Đã lưu thay đổi.");
    router.refresh();
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[32px] bg-ink text-white shadow-soft">
          <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.4fr_0.9fr] md:px-8">
            <div>
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-teal-100">
                Family vaccine tracker
              </div>
              <h1 className="mt-6 text-3xl font-black leading-tight md:text-5xl">
                Quản lý lịch tiêm cho cả gia đình, minh bạch và an toàn.
              </h1>
              <button
                onClick={signOut}
                className="mt-6 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Đăng xuất ({bootstrap.userEmail})
              </button>
            </div>
            <div className="hidden md:block">
               {/* Visual element or stats can go here */}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <MemberSelector
              members={bootstrap.members}
              selectedMember={selectedMember}
              onNotify={notify}
              canManageMembers={canEditSelectedMember}
            />

            {selectedMember ? (
              <>
                <StatsOverview
                  scheduleItems={scheduleItems}
                  completedItems={completedItems}
                  plannedItems={plannedItems}
                  overdueItemsCount={overdueItemsCount}
                  progress={progress}
                />

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
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`/api/family-members/${selectedMember.id}/calendar.ics`}
                        className="rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slateWarm"
                      >
                        Tải file Calendar (.ics)
                      </a>
                      <a
                        href={`/api/family-members/${selectedMember.id}/record.pdf`}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Xuất PDF
                      </a>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 md:flex-row">
                    <div className="flex bg-slate-200/50 p-1 rounded-2xl mr-2">
                       <button 
                         onClick={() => setViewMode("timeline")}
                         className={cn("px-4 py-2 text-sm font-semibold rounded-xl transition", viewMode === "timeline" ? "bg-white shadow text-teal-700" : "text-slate-500")}
                       >
                         Timeline
                       </button>
                       <button 
                         onClick={() => setViewMode("calendar")}
                         className={cn("px-4 py-2 text-sm font-semibold rounded-xl transition", viewMode === "calendar" ? "bg-white shadow text-teal-700" : "text-slate-500")}
                       >
                         Lịch (Tháng)
                       </button>
                    </div>
                    {viewMode === "timeline" && (
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Tìm theo tên mũi, bệnh hoặc mốc"
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
                    />
                    )}
                    {viewMode === "timeline" && (
                    <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      {(["all", "todo", "overdue", "done"] as FilterTab[]).map((filter) => (
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
                              : filter === "overdue"
                                ? `Quá hạn (${overdueItemsCount})`
                              : `Đã tiêm (${completedItems.length})`}
                        </button>
                      ))}
                    </div>
                    )}
                  </div>

                  {viewMode === "timeline" ? (
                    <div className="mt-6 space-y-4">
                      {filteredItems.map((item) => (
                        <TimelineItem
                          key={item.id}
                          item={item}
                          selectedMember={selectedMember}
                          onNotify={notify}
                          onShiftProposal={handleShiftProposal}
                          disabled={!canEditSelectedMember}
                        />
                      ))}
                    </div>
                  ) : (
                    <CalendarView items={scheduleItems} />
                  )}
                </div>
              </>
            ) : null}
          </div>

          <aside className="space-y-6">
            {selectedMember ? (
              <>
                <UpcomingWidget scheduleItems={scheduleItems} />
                <CustomItemForm
                  selectedMember={selectedMember}
                  onNotify={notify}
                  disabled={!canEditSelectedMember}
                />
                <ReminderSettingsForm
                  selectedMember={selectedMember}
                  reminderPreferences={getDefaultReminderPreferences(
                    selectedMember.id,
                    bootstrap.reminderPreferences,
                    bootstrap.userEmail,
                  )}
                  onNotify={notify}
                  disabled={!canEditSelectedMember}
                />
              </>
            ) : null}
            <HouseholdManager
              households={bootstrap.households}
              householdMemberships={bootstrap.householdMemberships}
              onNotify={notify}
            />
            <AccountManager onNotify={notify} />
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

      {shiftProposal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900">Lịch tiêm liên đới</h3>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Việc đổi ngày mũi tiêm này ảnh hưởng đến khoảng cách tối thiểu của các mũi tiếp theo. 
              Bạn có muốn tự động dời lịch cho các mũi sau không?
            </p>
            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
              {shiftProposal.changes.map(c => (
                <div key={c.id} className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">{c.vaccine_name}</span>
                  <span className="text-teal-700 font-bold">→ {c.scheduled_date}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                onClick={() => finalizeUpdate(shiftProposal.targetId, shiftProposal.newDate, false)}
                className="rounded-2xl border border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50"
              >
                Chỉ mũi này
              </button>
              <button
                onClick={() => finalizeUpdate(shiftProposal.targetId, shiftProposal.newDate, true)}
                className="rounded-2xl bg-teal-700 py-3 font-bold text-white hover:bg-teal-800"
              >
                Đồng ý dời hết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
