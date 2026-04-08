import { AuthFlow } from "@/components/auth-flow";
import { DashboardApp } from "@/components/dashboard-app";
import { loadDashboardData } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const params = await searchParams;
  const bootstrap = await loadDashboardData(params.childId);

  if (!bootstrap) {
    return <AuthFlow />;
  }

  return <DashboardApp bootstrap={bootstrap} />;
}
