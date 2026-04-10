"use client";

import { ScheduleItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
          {overdueItemsCount > 0 ? (
            <span className="font-bold text-rose-600">⚠️ {overdueItemsCount} mũi quá hạn</span>
          ) : (
            "Các mũi đang ở trạng thái sắp tiêm."
          )}
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
          Tính thực tế nếu có.
        </p>
      </div>
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Tổng dự kiến
        </p>
        <div className="mt-3 text-3xl font-black text-ink">
          {formatCurrency(projectedBudget)}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Theo lịch mẫu & tự tạo.
        </p>
      </div>
    </div>
  );
}
