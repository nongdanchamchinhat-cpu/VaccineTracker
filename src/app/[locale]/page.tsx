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
  let bootstrap = null;

  try {
    bootstrap = await loadDashboardData(params.memberId);
  } catch (error) {
    console.error("Falling back to guest dashboard:", error);
  }

  if (!bootstrap) {
    return <GuestDashboardApp />;
  }

  return <DashboardApp bootstrap={bootstrap} />;
}
