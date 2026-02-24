import { listTasks } from "@/app/actions/tasks";
import { getWeekData } from "@/app/actions/week-data";
import { getWeekStartMonday } from "@/lib/timezone";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import { todayISO } from "@/lib/date-utils";
import { TasksView } from "@/components/TasksView";

export type HabitForDate = {
  id: string;
  name: string;
  targetPerWeek: number;
  countThisWeek: number;
  done: boolean;
  skipped: boolean;
};

type PageProps = { searchParams: Promise<{ date?: string }> };

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = todayISO();
  const dateISO =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : today;
  const weekStart = getWeekStartMonday(dateISO);
  const [{ tasks }, { habits }] = await Promise.all([
    listTasks({ dueDateISO: dateISO }),
    getWeekData(weekStart),
  ]);
  const habitsForDate: HabitForDate[] = habits
    .filter((h) => !h.archived)
    .map((h) => ({
      id: h.id,
      name: h.name,
      targetPerWeek: h.targetPerWeek,
      countThisWeek: h.countThisWeek,
      done: (h.countsByDay[dateISO] ?? 0) >= 1,
      skipped: h.skippedByDay[dateISO] ?? false,
    }));

  return (
    <TasksView
      initialTasks={tasks}
      habitsForDate={habitsForDate}
      selectedDateISO={dateISO}
      todayISO={today}
    />
  );
}
