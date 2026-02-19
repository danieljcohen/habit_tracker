import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { HabitsManageView } from "@/components/HabitsManageView";

export default async function HabitsPage() {
  const habits = await prisma.habit.findMany({
    orderBy: { createdAt: "asc" },
  });

  return <HabitsManageView initialHabits={habits} />;
}
