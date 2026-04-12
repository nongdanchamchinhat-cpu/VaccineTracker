"use client";

import { useState } from "react";

import { Household, HouseholdMembership, HouseholdRole } from "@/lib/types";

interface HouseholdManagerProps {
  households: Household[];
  householdMemberships: HouseholdMembership[];
  onNotify: (msg: string) => void;
}

const ROLE_LABELS: Record<HouseholdRole, string> = {
  owner: "Chủ sở hữu",
  editor: "Biên tập",
  viewer: "Chỉ xem",
};

export function HouseholdManager({
  households,
  householdMemberships,
  onNotify,
}: HouseholdManagerProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [isInviting, setIsInviting] = useState(false);

  const primaryHousehold = households[0] ?? null;
  const primaryMembership = primaryHousehold
    ? householdMemberships.find((membership) => membership.household_id === primaryHousehold.id) ?? null
    : null;
  const canInvite = primaryMembership?.role === "owner";

  async function handleInvite() {
    if (!inviteEmail || !primaryHousehold || !canInvite) return;

    setIsInviting(true);
    try {
      const response = await fetch("/api/households/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          household_id: primaryHousehold.id,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        emailSent?: boolean;
        inviteUrl?: string;
      };

      if (!response.ok) {
        onNotify(payload.error ?? "Không thể gửi lời mời.");
        return;
      }

      if (payload.emailSent) {
        onNotify(`Đã gửi lời mời tới ${inviteEmail}.`);
      } else if (payload.inviteUrl) {
        await navigator.clipboard.writeText(payload.inviteUrl);
        onNotify(`Đã tạo link mời và copy vào clipboard cho ${inviteEmail}.`);
      } else {
        onNotify(`Đã tạo lời mời cho ${inviteEmail}.`);
      }

      setInviteEmail("");
      setInviteRole("editor");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Không thể gửi lời mời.");
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">
        Chia sẻ gia đình
      </p>
      <div className="mt-4 space-y-4">
        {households.map((household) => {
          const membership =
            householdMemberships.find((item) => item.household_id === household.id) ?? null;
          return (
            <div
              key={household.id}
              className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
            >
              <div>
                <div className="font-bold text-slate-900">{household.name}</div>
                <div className="text-xs text-slate-500">ID: {household.id.slice(0, 8)}...</div>
              </div>
              <div className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-700">
                {membership ? ROLE_LABELS[membership.role] : "Không rõ quyền"}
              </div>
            </div>
          );
        })}

        <div className="pt-2">
          <label className="text-sm font-semibold text-slate-700">Mời thành viên mới</label>
          <p className="mt-1 text-xs text-slate-500">
            Owner có thể mời người khác với quyền `editor` hoặc `viewer`.
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_140px_auto]">
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="Email người thân..."
              disabled={!canInvite}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as "editor" | "viewer")}
              disabled={!canInvite}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={isInviting || !inviteEmail || !canInvite}
              className="rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isInviting ? "Đang gửi..." : "Mời"}
            </button>
          </div>
          {!canInvite ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
              Bạn đang ở chế độ {primaryMembership ? ROLE_LABELS[primaryMembership.role] : "chỉ xem"} nên không thể gửi lời mời.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
