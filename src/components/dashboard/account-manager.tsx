"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";

interface AccountManagerProps {
  onNotify: (message: string) => void;
}

export function AccountManager({ onNotify }: AccountManagerProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteAccount() {
    if (confirmText !== "XOA") {
      onNotify("Nhập đúng 'XOA' để xác nhận.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/me/account", { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        onNotify(payload.error ?? "Không thể xoá tài khoản.");
        return;
      }

      onNotify("Đã xoá tài khoản.");
      router.push({ pathname: "/" });
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">
        Tài khoản
      </p>
      <div className="mt-4 space-y-4">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/api/me/export";
          }}
          className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Xuất dữ liệu JSON
        </button>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-bold text-rose-900">Xoá tài khoản</p>
          <p className="mt-2 text-xs leading-5 text-rose-800">
            Hành động này sẽ xoá dữ liệu household do bạn sở hữu nếu household đó không còn ai khác.
            Nếu bạn đang là owner của household chia sẻ, hệ thống sẽ chặn thao tác.
          </p>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="Nhập XOA để xác nhận"
            className="mt-3 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 outline-none focus:border-rose-400"
          />
          <button
            onClick={deleteAccount}
            disabled={isDeleting || confirmText !== "XOA"}
            className="mt-3 w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {isDeleting ? "Đang xoá..." : "Xoá tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}
