import { listTasks } from "@/app/actions/tasks";

export const dynamic = "force-dynamic";
import { todayISO } from "@/lib/date-utils";
import { TasksView } from "@/components/TasksView";

type PageProps = { searchParams: Promise<{ date?: string }> };

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = todayISO();
  const dateISO =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : today;
  const { tasks } = await listTasks({ dueDateISO: dateISO });

  return (
    <TasksView
      initialTasks={tasks}
      selectedDateISO={dateISO}
      todayISO={today}
    />
  );
}
