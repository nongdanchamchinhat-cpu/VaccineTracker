"use client";

import { useState } from "react";
import { ScheduleItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UpcomingWidgetProps {
  scheduleItems: ScheduleItem[];
}

export function UpcomingWidget({ scheduleItems }: UpcomingWidgetProps) {
  // Get upcoming 30 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);

  const upcoming = scheduleItems.filter(item => {
    if (item.status === "completed" || item.status === "skipped") return false;
    const itemDate = new Date(item.scheduled_date);
    return itemDate >= today && itemDate <= in30Days;
  }).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">
        30 Ngày Tới
      </p>
      <div className="mt-4 space-y-3">
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">Không có mũi tiêm nào trong 30 ngày tới.</p>
        ) : (
          upcoming.map((item) => {
            const dateObj = new Date(item.scheduled_date);
            const isSoon = dateObj.getTime() - today.getTime() <= 7 * 24 * 60 * 60 * 1000;
            return (
              <div key={item.id} className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-slate-900 text-sm">{item.vaccine_name}</span>
                  <span className={cn("text-xs font-bold rounded-lg px-2 py-1", isSoon ? "bg-amber-100 text-amber-800" : "bg-teal-50 text-teal-700")}>
                    {dateObj.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{item.disease}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
