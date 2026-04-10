"use client";

import { useState } from "react";
import { ScheduleItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  items: ScheduleItem[];
  onSelectDate?: (dateStr: string) => void;
}

export function CalendarView({ items, onSelectDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  // Generate calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // padding for first week
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Start on Monday
  const gridCells = [];
  
  for (let i = 0; i < startOffset; i++) {
    gridCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayItems = items.filter(i => i.scheduled_date === dString);
    gridCells.push({ day: d, dateStr: dString, items: dayItems });
  }

  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 mt-4 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
        <button onClick={prevMonth} className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">&lt;</button>
        <span className="font-bold text-slate-900">Tháng {month + 1}, {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">&gt;</button>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
        {weekdays.map(wd => (
          <div key={wd} className="py-2 text-center text-xs font-bold text-slate-500">{wd}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {gridCells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="border-r border-b border-slate-100 min-h-24 bg-slate-50/30"></div>;
          }
          const hasOverdue = cell.items.some(i => i.status === 'overdue');
          const hasPlanned = cell.items.some(i => i.status === 'planned');
          const hasCompleted = cell.items.length > 0 && cell.items.every(i => i.status === 'completed');
          
          return (
            <div 
              key={cell.day} 
              className="border-r border-b border-slate-100 min-h-24 p-1 hover:bg-slate-50 cursor-default"
              onClick={() => onSelectDate?.(cell.dateStr)}
            >
              <div className="text-right p-1 text-xs text-slate-400 font-medium">{cell.day}</div>
              <div className="flex flex-col gap-1 px-1">
                {cell.items.map(item => (
                   <div key={item.id} className={cn(
                     "text-[10px] sm:text-xs truncate px-1 rounded",
                     item.status === 'completed' ? "bg-teal-100 text-teal-800" 
                     : item.status === 'overdue' ? "bg-rose-100 text-rose-800 font-bold animate-pulse-slow" 
                     : item.status === 'skipped' ? "bg-slate-200 text-slate-500"
                     : "bg-amber-100 text-amber-800"
                   )} title={item.vaccine_name}>
                     {item.vaccine_name}
                   </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
