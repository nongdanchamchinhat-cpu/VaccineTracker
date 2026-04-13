"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FamilyMember, ScheduleItem, ScheduleItemStatus } from "@/lib/types";
import { cn, formatDateLabel, formatCurrency } from "@/lib/utils";
import { generateSingleEventICS } from "@/lib/ics";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface TimelineItemProps {
  item: ScheduleItem;
  selectedMember: FamilyMember;
  onNotify: (msg: string) => void;
  onShiftProposal: (itemId: string, newDate: string) => Promise<void>;
  disabled?: boolean;
}

export function TimelineItem({
  item,
  selectedMember,
  onNotify,
  onShiftProposal,
  disabled = false,
}: TimelineItemProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(
    item.photo_url?.startsWith("http") ? item.photo_url : null,
  );
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function loadSignedUrl() {
      if (!item.photo_url || item.photo_url.startsWith("http")) {
        setSignedPhotoUrl(item.photo_url);
        return;
      }

      const { data, error } = await supabase.storage
        .from("vaccine-records")
        .createSignedUrl(item.photo_url, 60 * 60);

      if (!error && data?.signedUrl) {
        setSignedPhotoUrl(data.signedUrl);
      }
    }

    void loadSignedUrl();
  }, [item.photo_url, supabase]);

  async function quickComplete() {
    const response = await fetch(`/api/schedule-items/${item.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actual_price: item.actual_price ?? item.estimated_price ?? null,
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      onNotify(payload.error ?? "Không thể cập nhật trạng thái mũi.");
      return;
    }

    onNotify(`Đã đánh dấu "${item.vaccine_name}" là đã tiêm.`);
    router.refresh();
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `${selectedMember.id}/${item.id}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from("vaccine-records")
        .upload(fileName, file);

      if (error) {
        onNotify("Lỗi tải ảnh: " + error.message);
        return;
      }

      // Store the storage path. The viewer resolves it to a signed URL at render time.
      await fetch(`/api/schedule-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, photo_url: data.path }),
      });

      onNotify("Đã tải lên ảnh chứng nhận.");
      router.refresh();
    } finally {
      setIsUploading(false);
    }
  }

  async function updateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newDate = String(formData.get("scheduled_date") || "");

    if (item.scheduled_date !== newDate) {
      await onShiftProposal(item.id, newDate);
      return;
    }

    const body = {
      status: formData.get("status") as ScheduleItemStatus,
      scheduled_date: newDate,
      estimated_price: formData.get("estimated_price") ? Number(formData.get("estimated_price")) : null,
      actual_price: formData.get("actual_price") ? Number(formData.get("actual_price")) : null,
      vaccine_name: String(formData.get("vaccine_name") || ""),
      disease: String(formData.get("disease") || ""),
      origin: String(formData.get("origin") || ""),
      notes: String(formData.get("notes") || "") || null,
      // Phase 3 Batch fields
      lot_number: String(formData.get("lot_number") || "") || null,
      photo_url: String(formData.get("photo_url") || "") || null,
      adverse_reactions: String(formData.get("adverse_reactions") || "") || null,
    };

    const response = await fetch(`/api/schedule-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.json();
      onNotify(payload.error ?? "Không thể cập nhật mũi tiêm.");
      return;
    }

    setIsEditing(false);
    onNotify("Đã lưu thay đổi.");
    router.refresh();
  }

  return (
    <article className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
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
            {item.lot_number && (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700 font-medium">
                Sô lô: {item.lot_number}
              </span>
            )}
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
                  : item.status === "overdue"
                    ? "bg-rose-100 text-rose-800 animate-pulse-slow"
                    : "bg-amber-100 text-amber-800",
            )}
          >
            {item.status === "completed"
              ? "Đã tiêm"
              : item.status === "skipped"
                ? "Bỏ qua"
                : item.status === "overdue"
                  ? "Quá hạn"
                  : "Sắp tiêm"}
          </div>
          <div className="mt-3 text-sm text-slate-500">
            Dự kiến: {formatCurrency(item.estimated_price)}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Thực tế: {formatCurrency(item.actual_price)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                const icsContent = generateSingleEventICS({
                  memberName: selectedMember.name,
                  timezone: selectedMember.timezone,
                  item,
                });
                const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `${item.vaccine_name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, "-")}.ics`;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                URL.revokeObjectURL(url);
              }}
              className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
            >
              Tải .ics
            </button>
            {item.status !== "completed" ? (
              <button
                onClick={quickComplete}
                disabled={disabled}
                className="rounded-2xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Đã tiêm
              </button>
            ) : null}
            <button
              onClick={() => setIsEditing(!isEditing)}
              disabled={disabled}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
            >
              {disabled ? "Chỉ xem" : isEditing ? "Đóng sửa" : "Sửa chi tiết"}
            </button>
          </div>
        </div>
      </div>

      {isEditing && !disabled ? (
        <form
          id={`edit-form-${item.id}`}
          className="mt-5 grid gap-3 border-t border-slate-200 pt-5 md:grid-cols-2"
          onSubmit={updateItem}
        >
          <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
              Tên Vaccine
              <input
                name="vaccine_name"
                defaultValue={item.vaccine_name}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
              Ngày tiêm
              <input
                name="scheduled_date"
                type="date"
                defaultValue={item.scheduled_date}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
             <label className="flex flex-col gap-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
              Bệnh phòng ngừa
              <input
                name="disease"
                defaultValue={item.disease}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
              Số lô (Lot Number)
              <input
                name="lot_number"
                defaultValue={item.lot_number || ""}
                placeholder="Ví dụ: AB12345"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
              Giá dự kiến
              <input
                name="estimated_price"
                type="number"
                defaultValue={item.estimated_price || ""}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
              Giá thực tế
              <input
                name="actual_price"
                type="number"
                defaultValue={item.actual_price || ""}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Trạng thái
            <select
              name="status"
              defaultValue={item.status}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
            >
              <option value="planned">Sắp tiêm</option>
              <option value="completed">Đã tiêm</option>
              <option value="skipped">Bỏ qua</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Ảnh chứng nhận (Sổ tiêm/Giấy xác nhận)
            {signedPhotoUrl ? (
              <div className="mb-2 relative h-32 w-full overflow-hidden rounded-2xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signedPhotoUrl} alt="Vaccine Record" className="h-full w-full object-cover" />
                <button 
                   type="button"
                   onClick={() => {/* logic to remove photo */}}
                   className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full text-[10px]"
                >
                  Xoá
                </button>
              </div>
            ) : null}
            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleFileUpload}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
            {isUploading && <span className="text-[10px] text-teal-600 animate-pulse">Đang tải lên...</span>}
          </label>

          <label className="flex flex-col gap-1 md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Phản ứng sau tiêm
            <textarea
              name="adverse_reactions"
              defaultValue={item.adverse_reactions || ""}
              placeholder="Sốt nhẹ, sưng vầng tiêm..."
              className="min-h-20 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
            />
          </label>

          <label className="flex flex-col gap-1 md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Ghi chú
            <textarea
              name="notes"
              defaultValue={item.notes || ""}
              className="min-h-20 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
            />
          </label>

          <button
            type="submit"
            className="rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 md:col-span-2"
          >
            Lưu thay đổi
          </button>
        </form>
      ) : null}
    </article>
  );
}
