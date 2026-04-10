"use client";

import { FormEvent, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";

export function AuthFlow() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể gửi mã OTP.");
      }

      setStatus(payload.message ?? "Đã gửi mã OTP.");
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi mã OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Mã xác thực không hợp lệ.");
      }

      setStatus(payload.message ?? "Đăng nhập thành công.");
      router.push({ pathname: "/" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã xác thực không hợp lệ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 md:px-8">
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] bg-ink px-6 py-8 text-white shadow-soft md:px-10 md:py-12">
          <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-teal-100">
            Family Vaccine Tracker
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight md:text-5xl">
            Quản lý lịch tiêm cho cả gia đình trên một tài khoản.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Đăng nhập chỉ dành cho người muốn đồng bộ lịch tiêm chủng lên database.
            Nếu không đăng nhập, bạn vẫn có thể dùng app ở chế độ local storage ngay từ trang chủ.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold text-teal-200">Đăng nhập OTP</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Không dùng mật khẩu. Phụ huynh chỉ cần email để nhận mã xác thực.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold text-amber-200">Lịch mẫu + tuỳ chỉnh</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Tạo lịch riêng cho trẻ nhỏ, thiếu niên, người lớn, cao tuổi hoặc thai kỳ.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-soft md:px-8 md:py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">
            Đăng nhập
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-900">
            Bắt đầu bằng email của bạn
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            OTP là tuỳ chọn để đồng bộ dữ liệu server-side. Nếu chỉ muốn dùng nhanh trên
            thiết bị hiện tại, quay lại trang chủ và dùng guest mode.
          </p>

          <Link
            href={{ pathname: "/" }}
            className="mt-4 inline-flex rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Quay lại chế độ không đăng nhập
          </Link>

          {step === "request" ? (
            <form className="mt-8 space-y-4" onSubmit={handleRequestOtp}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="parent@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={submitting || !email}
                className="w-full rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Đang gửi OTP..." : "Gửi mã OTP"}
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={handleVerifyOtp}>
              <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                OTP đã được gửi tới <span className="font-semibold">{email}</span>.
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Mã xác thực</span>
                <input
                  required
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="123456"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 tracking-[0.35em] outline-none transition focus:border-teal-500 focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={submitting || token.length < 6}
                className="w-full rounded-2xl bg-ink px-4 py-3 font-semibold text-white transition hover:bg-slateWarm disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Đang xác thực..." : "Xác thực và vào app"}
              </button>

              <button
                type="button"
                onClick={() => setStep("request")}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Dùng email khác
              </button>
            </form>
          )}

          {status ? (
            <p className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
              {status}
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
