import { getMonthMetrics } from "@/app/actions/metrics";
import { MetricsView } from "@/components/MetricsView";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  let monthMetrics = [];
  try {
    monthMetrics = await getMonthMetrics(12);
  } catch (error) {
    // In production (e.g. Vercel) we don't want a transient DB error
    // to break the entire build; instead, show an empty metrics view.
    console.error("Failed to load month metrics", error);
    monthMetrics = [];
  }
  return <MetricsView monthMetrics={monthMetrics} />;
}
