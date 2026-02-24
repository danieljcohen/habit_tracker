import { MetricsView } from "@/components/MetricsView";
import type { MonthMetric } from "@/app/actions/metrics";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  // On Vercel (production), skip metrics DB work entirely to avoid build-time
  // failures from Prisma connectivity. Show an empty metrics view instead.
  if (process.env.VERCEL === "1") {
    return <MetricsView monthMetrics={[]} />;
  }

  const { getMonthMetrics } = await import("@/app/actions/metrics");
  const monthMetrics: MonthMetric[] = await getMonthMetrics(12);
  return <MetricsView monthMetrics={monthMetrics} />;
}
