import { DashboardApp } from "@/components/dashboard-app";
import { GuestDashboardApp } from "@/components/guest-dashboard-app";
import { loadDashboardData } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string }>;
}) {
  const params = await searchParams;
  const bootstrap = await loadDashboardData(params.memberId);

  if (!bootstrap) {
    return <GuestDashboardApp />;
  }

  return <DashboardApp bootstrap={bootstrap} />;
}
