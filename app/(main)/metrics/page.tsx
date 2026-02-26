import { MetricsView } from "@/components/MetricsView";
import type { MonthMetric } from "@/app/actions/metrics";
import type { WeightEntry } from "@/app/actions/weight-logs";
import type { DietScore } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  let monthMetrics: MonthMetric[] = [];
  let weightEntries: WeightEntry[] = [];
  let dietScores: DietScore[] = [];

  try {
    const { getMonthMetrics } = await import("@/app/actions/metrics");
    const { listWeightEntries } = await import("@/app/actions/weight-logs");
    const { prisma } = await import("@/lib/db");
    monthMetrics = await getMonthMetrics(12);
    const res = await listWeightEntries({ daysBack: 90 });
    weightEntries = res.entries;
    dietScores = await prisma.dietScore.findMany({
      orderBy: { dateISO: "desc" },
      take: 30,
    });
  } catch (err) {
    console.error("Metrics page: failed to load data", err);
  }

  return (
    <MetricsView
      monthMetrics={monthMetrics}
      weightEntries={weightEntries}
      dietScores={dietScores}
    />
  );
}
