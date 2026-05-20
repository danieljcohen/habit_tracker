import { listPlans } from "@/app/actions/tasks";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { todayISO } from "@/lib/date-utils";
import { PlansView } from "@/components/PlansView";

export default async function PlansPage() {
  const { plans } = await listPlans();
  const today = todayISO();
  return <PlansView initialPlans={plans} todayISO={today} />;
}
