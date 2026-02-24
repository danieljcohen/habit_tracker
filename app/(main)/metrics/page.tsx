import { getMonthMetrics } from "@/app/actions/metrics";
import { MetricsView } from "@/components/MetricsView";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const monthMetrics = await getMonthMetrics(12);
  return <MetricsView monthMetrics={monthMetrics} />;
}
