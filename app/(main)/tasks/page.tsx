import { listTasks } from "@/app/actions/tasks";
import { getWeekData } from "@/app/actions/week-data";
import { getDayOrder } from "@/app/actions/day-order";
import { listFoodForDay } from "@/app/actions/food-logs";
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

export type DayItem =
  | {
      kind: "habit";
      id: string;
      name: string;
      targetPerWeek: number;
      countThisWeek: number;
      done: boolean;
      skipped: boolean;
    }
  | {
      kind: "task";
      id: string;
      title: string;
      completed: boolean;
    };

type PageProps = { searchParams: Promise<{ date?: string }> };

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = todayISO();
  const dateISO =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : today;
  type TasksResult = Awaited<ReturnType<typeof listTasks>>;
  type WeekResult = Awaited<ReturnType<typeof getWeekData>>;
  type DayOrderResult = Awaited<ReturnType<typeof getDayOrder>>;
  type FoodResult = Awaited<ReturnType<typeof listFoodForDay>>;

  let tasks: TasksResult["tasks"] = [];
  let habits: WeekResult["habits"] = [];
  let order: DayOrderResult["order"] = [];
  let foodEntries: FoodResult["entries"] = [];

  try {
    const weekStart = getWeekStartMonday(dateISO);
    const [tasksRes, weekRes, orderRes, foodRes] = await Promise.all([
      listTasks({ dueDateISO: dateISO }),
      getWeekData(weekStart),
      getDayOrder({ dateISO }),
      listFoodForDay({ dateISO }),
    ]);
    tasks = tasksRes.tasks;
    habits = weekRes.habits;
    order = orderRes.order;
    foodEntries = foodRes.entries;
  } catch (error) {
    // Don't let transient backend errors break the build; show empty Today view instead.
    console.error("Failed to load Today data", error);
  }

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

  const dayItemsMap = new Map<string, DayItem>();
  for (const h of habitsForDate) {
    const item: DayItem = {
      kind: "habit",
      id: h.id,
      name: h.name,
      targetPerWeek: h.targetPerWeek,
      countThisWeek: h.countThisWeek,
      done: h.done,
      skipped: h.skipped,
    };
    dayItemsMap.set(`habit:${h.id}`, item);
  }
  for (const t of tasks) {
    const item: DayItem = {
      kind: "task",
      id: t.id,
      title: t.title,
      completed: t.completed,
    };
    dayItemsMap.set(`task:${t.id}`, item);
  }

  const ordered: DayItem[] = [];
  const seen = new Set<string>();
  for (const o of order) {
    const key = `${o.itemType}:${o.itemId}`;
    const item = dayItemsMap.get(key);
    if (!item) continue;
    ordered.push(item);
    seen.add(key);
  }

  dayItemsMap.forEach((item, key) => {
    if (!seen.has(key)) {
      ordered.push(item);
    }
  });

  return (
    <TasksView
      initialItems={ordered}
      initialFood={foodEntries}
      selectedDateISO={dateISO}
      todayISO={today}
    />
  );
}
