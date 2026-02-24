import { MetricsView } from "@/components/MetricsView";
import type { MonthMetric } from "@/app/actions/metrics";
import type { WeightEntry } from "@/app/actions/weight-logs";
import type { DietScore } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  // On Vercel (production), skip metrics DB work entirely to avoid build-time
  // failures from Prisma connectivity. Show an empty metrics view instead.
  if (process.env.VERCEL === "1") {
    return <MetricsView monthMetrics={[]} weightEntries={[]} dietScores={[]} />;
  }

  const { getMonthMetrics } = await import("@/app/actions/metrics");
  const { listWeightEntries } = await import("@/app/actions/weight-logs");
  const { prisma } = await import("@/lib/db");
  const monthMetrics: MonthMetric[] = await getMonthMetrics(12);
  const { entries: weightEntries }: { entries: WeightEntry[] } =
    await listWeightEntries({ daysBack: 90 });
  const dietScores: DietScore[] = await prisma.dietScore.findMany({
    orderBy: { dateISO: "desc" },
    take: 30,
  });
  return (
    <MetricsView
      monthMetrics={monthMetrics}
      weightEntries={weightEntries}
      dietScores={dietScores}
    />
  );
}
