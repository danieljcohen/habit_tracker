import { MetricsView } from "@/components/MetricsView";
import type { MonthMetric } from "@/app/actions/metrics";
import type { WeightEntry } from "@/app/actions/weight-logs";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  // On Vercel (production), skip metrics DB work entirely to avoid build-time
  // failures from Prisma connectivity. Show an empty metrics view instead.
  if (process.env.VERCEL === "1") {
    return <MetricsView monthMetrics={[]} weightEntries={[]} />;
  }

  const { getMonthMetrics } = await import("@/app/actions/metrics");
  const { listWeightEntries } = await import("@/app/actions/weight-logs");
  const monthMetrics: MonthMetric[] = await getMonthMetrics(12);
  const { entries: weightEntries }: { entries: WeightEntry[] } =
    await listWeightEntries({ daysBack: 90 });
  return <MetricsView monthMetrics={monthMetrics} weightEntries={weightEntries} />;
}
