"use client";

import { ScheduleItem } from "@/lib/types";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

interface StatsOverviewProps {
  scheduleItems: ScheduleItem[];
  completedItems: ScheduleItem[];
  plannedItems: ScheduleItem[];
  overdueItemsCount: number;
  progress: number;
}

export function StatsOverview({
  scheduleItems,
  completedItems,
  plannedItems,
  overdueItemsCount,
  progress,
}: StatsOverviewProps) {
  const spent = completedItems.reduce(
    (acc, item) => acc + (item.actual_price ?? item.estimated_price ?? 0),
    0,
  );
  const projectedBudget = scheduleItems.reduce(
    (acc, item) => acc + (item.estimated_price ?? 0),
    0,
  );

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="min-h-[152px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft sm:min-h-[164px] sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-xs sm:tracking-[0.28em]">
          Tiến độ
        </p>
        <div className="mt-3 text-[clamp(2rem,7vw,2.5rem)] font-black leading-none text-ink">
          {progress}%
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {completedItems.length}/{scheduleItems.length} mũi đã hoàn tất.
        </p>
      </div>
      <div className="min-h-[152px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft sm:min-h-[164px] sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-xs sm:tracking-[0.28em]">
          Còn phải tiêm
        </p>
        <div className="mt-3 text-[clamp(2rem,7vw,2.5rem)] font-black leading-none text-amber-600">
          {plannedItems.length}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {overdueItemsCount > 0 ? (
            <span className="font-bold text-rose-600">⚠️ {overdueItemsCount} mũi quá hạn</span>
          ) : (
            "Các mũi đang ở trạng thái sắp tiêm."
          )}
        </p>
      </div>
      <div className="min-h-[152px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft sm:min-h-[164px] sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-xs sm:tracking-[0.28em]">
          Đã chi
        </p>
        <div
          className="mt-3 text-[clamp(1.7rem,6vw,2rem)] font-black leading-tight text-teal-700"
          title={formatCurrency(spent)}
        >
          <span className="sm:hidden">{formatCompactCurrency(spent)}</span>
          <span className="hidden sm:inline">{formatCurrency(spent)}</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Tính thực tế nếu có.
        </p>
      </div>
      <div className="min-h-[152px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft sm:min-h-[164px] sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-xs sm:tracking-[0.28em]">
          Tổng dự kiến
        </p>
        <div
          className="mt-3 text-[clamp(1.7rem,6vw,2rem)] font-black leading-tight text-ink"
          title={formatCurrency(projectedBudget)}
        >
          <span className="sm:hidden">{formatCompactCurrency(projectedBudget)}</span>
          <span className="hidden sm:inline">{formatCurrency(projectedBudget)}</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Theo lịch mẫu & tự tạo.
        </p>
      </div>
    </div>
  );
}
