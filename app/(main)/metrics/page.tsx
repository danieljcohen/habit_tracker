import { getWeekMetrics, getMonthMetrics } from "@/app/actions/metrics";
import { MetricsView } from "@/components/MetricsView";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const [weekMetrics, monthMetrics] = await Promise.all([
    getWeekMetrics(8),
    getMonthMetrics(6),
  ]);
  return (
    <MetricsView
      weekMetrics={weekMetrics}
      monthMetrics={monthMetrics}
    />
  );
}
