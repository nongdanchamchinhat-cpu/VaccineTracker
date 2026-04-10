"use client";

import type { Route } from "next";
import { useTransition, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FamilyMember, MemberType } from "@/lib/types";
import { cn, formatDateLabel } from "@/lib/utils";
import { MEMBER_TYPE_ICONS } from "@/lib/constants";
import { useTranslations } from "next-intl";

interface MemberSelectorProps {
  members: FamilyMember[];
  selectedMember: FamilyMember | null;
  onNotify: (msg: string) => void;
  canManageMembers: boolean;
}

export function MemberSelector({
  members,
  selectedMember,
  onNotify,
  canManageMembers,
}: MemberSelectorProps) {
  const router = useRouter();
  const t = useTranslations("MemberSelector");
  const [isPending, startTransition] = useTransition();
  const [addMemberOpen, setAddMemberOpen] = useState(members.length === 0);
  const [memberForm, setMemberForm] = useState({
    name: "",
    birthDate: "",
    memberType: "infant" as MemberType,
    gender: "",
  });

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memberForm.name || !memberForm.birthDate) return;

    const createResponse = await fetch("/api/family-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: memberForm.name,
        birth_date: memberForm.birthDate,
        member_type: memberForm.memberType,
        gender: memberForm.gender || null,
      }),
    });

    const createPayload = (await createResponse.json()) as { error?: string; member?: FamilyMember };
    if (!createResponse.ok || !createPayload.member) {
      onNotify(createPayload.error ?? "Không thể tạo hồ sơ thành viên.");
      return;
    }

    const createdMember = createPayload.member;

    const scheduleResponse = await fetch(
      `/api/family-members/${createdMember.id}/schedule/from-template`,
      {
        method: "POST",
      },
    );

    const schedulePayload = (await scheduleResponse.json()) as { error?: string };
    if (!scheduleResponse.ok) {
      onNotify(schedulePayload.error ?? "Không thể khởi tạo lịch mẫu.");
      return;
    }

    setMemberForm({ name: "", birthDate: "", memberType: "infant", gender: "" });
    setAddMemberOpen(false);
    onNotify("Đã tạo hồ sơ thành viên và khởi tạo lịch mẫu.");
    startTransition(() => {
      router.push(`/?memberId=${createdMember.id}` as Route);
      router.refresh();
    });
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">
            {t("title")}
          </p>
          <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-slate-900">
            {selectedMember ? (
              <>
                <span>{MEMBER_TYPE_ICONS[selectedMember.member_type]}</span>
                <span>{selectedMember.name}</span>
              </>
            ) : (
              t("createFirstProfile")
            )}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {selectedMember
              ? `${t(`memberTypes.${selectedMember.member_type}`)} · ${t("bornOn")} ${formatDateLabel(selectedMember.birth_date)}`
              : t("createProfileToStart")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => {
                startTransition(() => {
                  router.push(`/?memberId=${member.id}` as Route);
                  router.refresh();
                });
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                member.id === selectedMember?.id
                  ? "bg-teal-700 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
              )}
            >
              {MEMBER_TYPE_ICONS[member.member_type]} {member.name}
            </button>
          ))}
          <button
            onClick={() => setAddMemberOpen((current) => !current)}
            disabled={!canManageMembers}
            className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
          >
            {!canManageMembers ? "Chỉ xem" : addMemberOpen ? "Đóng form" : "Thêm thành viên"}
          </button>
        </div>
      </div>

      {addMemberOpen && canManageMembers ? (
        <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={createMember}>
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
            {(Object.keys(MEMBER_TYPE_ICONS) as MemberType[]).map((value) => (
              <option key={value} value={value}>{MEMBER_TYPE_ICONS[value]} {t(`memberTypes.${value}`)}</option>
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
            disabled={isPending}
            className="rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 md:col-span-2"
          >
            {isPending ? "Đang khởi tạo..." : "Tạo hồ sơ và sinh lịch mẫu"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
