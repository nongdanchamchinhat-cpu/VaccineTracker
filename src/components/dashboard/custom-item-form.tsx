"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FamilyMember, VaccineTemplate } from "@/lib/types";

interface CustomItemFormProps {
  selectedMember: FamilyMember;
  onNotify: (msg: string) => void;
  disabled?: boolean;
}

export function CustomItemForm({
  selectedMember,
  onNotify,
  disabled = false,
}: CustomItemFormProps) {
  const router = useRouter();
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [vaccineSuggestions, setVaccineSuggestions] = useState<VaccineTemplate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setVaccineSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function searchTemplates(query: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (query.length < 2) {
      setVaccineSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/vaccine-templates/search?q=${encodeURIComponent(query)}`);
        if (resp.ok) {
          const payload = await resp.json();
          setVaccineSuggestions(payload.templates || []);
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function selectTemplate(t: VaccineTemplate) {
    setCustomForm(curr => ({
      ...curr,
      vaccine_name: t.vaccine_name,
      disease: t.disease,
      origin: t.origin,
      estimated_price: String(t.estimated_price),
      milestone: t.milestone,
      recommended_age_label: t.recommended_age_label,
    }));
    setVaccineSuggestions([]);
  }

  async function createCustomItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/schedule-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: selectedMember.id,
        ...customForm,
        estimated_price: customForm.estimated_price ? Number(customForm.estimated_price) : null,
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      onNotify(payload.error ?? "Không thể thêm mũi tuỳ chỉnh.");
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
    onNotify("Đã thêm mũi tuỳ chỉnh.");
    router.refresh();
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Thêm mũi ngoài lịch mẫu
          </p>
          <p className="text-sm text-slate-500">
            Dùng khi bác sĩ chỉ định thêm hoặc nhập lịch cũ.
          </p>
        </div>
        <button
          onClick={() => setCustomFormOpen((current) => !current)}
          disabled={disabled}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
        >
          {disabled ? "Chỉ xem" : customFormOpen ? "Đóng form" : "Thêm mũi"}
        </button>
      </div>

      {customFormOpen && !disabled ? (
        <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={createCustomItem}>
          <div className="relative md:col-span-2" ref={containerRef}>
            <div className="relative">
               <input
                 required
                 value={customForm.vaccine_name}
                 onChange={(event) => {
                   const val = event.target.value;
                   setCustomForm(curr => ({ ...curr, vaccine_name: val }));
                   searchTemplates(val);
                 }}
                 placeholder="Tên vaccine (nhập để tìm mẫu chuẩn)"
                 className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white pr-10"
               />
               {isSearching && (
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600"></div>
               )}
            </div>
            
            {vaccineSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Gợi ý từ dữ liệu chuẩn</div>
                {vaccineSuggestions.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t)}
                    className="w-full rounded-xl px-4 py-3 text-left transition hover:bg-slate-50 focus:bg-teal-50 focus:outline-none"
                  >
                    <div className="font-bold text-slate-900">{t.vaccine_name}</div>
                    <div className="text-xs text-slate-500">{t.disease} · {t.origin}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            required
            type="date"
            value={customForm.scheduled_date}
            onChange={(event) => setCustomForm(curr => ({ ...curr, scheduled_date: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
          />
          <input
            required
            value={customForm.disease}
            onChange={(event) => setCustomForm(curr => ({ ...curr, disease: event.target.value }))}
            placeholder="Bệnh phòng ngừa"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
          />
          <input
            required
            value={customForm.origin}
            onChange={(event) => setCustomForm(curr => ({ ...curr, origin: event.target.value }))}
            placeholder="Xuất xứ"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
          />
          <input
            value={customForm.estimated_price}
            onChange={(event) => setCustomForm(curr => ({ ...curr, estimated_price: event.target.value }))}
            placeholder="Chi phí dự kiến"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
          />
          <input
            value={customForm.milestone}
            onChange={(event) => setCustomForm(curr => ({ ...curr, milestone: event.target.value }))}
            placeholder="Mốc hiển thị"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
          />
          <input
            value={customForm.recommended_age_label}
            onChange={(event) => setCustomForm(curr => ({ ...curr, recommended_age_label: event.target.value }))}
            placeholder="Nhãn gợi ý"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
          />
          <textarea
            value={customForm.notes}
            onChange={(event) => setCustomForm(curr => ({ ...curr, notes: event.target.value }))}
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
    </div>
  );
}
