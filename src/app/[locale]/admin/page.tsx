import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch basic aggregate analytics
  const [{ count: usersCount }, { count: membersCount }, { count: itemsCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("family_members").select("*", { count: "exact", head: true }),
    supabase.from("member_vaccine_items").select("*", { count: "exact", head: true })
  ]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black text-slate-900">Nội bộ: Analytics Dashboard</h1>
        <p className="mt-2 text-slate-500">Giám sát hoạt động hệ thống (Phase 4).</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tổng Users</h3>
            <p className="mt-2 text-4xl font-black text-teal-700">{usersCount ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Profiles Hồ sơ</h3>
            <p className="mt-2 text-4xl font-black text-ink">{membersCount ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tổng mũi tiêm</h3>
            <p className="mt-2 text-4xl font-black text-amber-600">{itemsCount ?? 0}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Hướng phát triển</h2>
          <ul className="mt-4 list-disc pl-5 text-slate-600 space-y-2">
             <li>Thích hợp để render biểu đồ người tiêm vắc xin hàng tháng (sử dụng Recharts).</li>
             <li>Hiển thị Audit log cho các hành động quan trọng để Admin dễ rà soát.</li>
             <li>Phân quyền: Hiện đang hiển thị tạm thời cho user đang đăng nhập. Cần setup Role=Admin trong schema bảng `profiles`.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
