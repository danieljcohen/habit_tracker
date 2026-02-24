import { getWeekData } from "@/app/actions/week-data";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import { todayISO } from "@/lib/date-utils";
import { getWeekStartMonday } from "@/lib/timezone";
import { WeekView } from "@/components/WeekView";

type PageProps = { searchParams: Promise<{ week?: string }> };

export default async function WeekPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = todayISO();
  const weekStart =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week)
      ? getWeekStartMonday(params.week)
      : getWeekStartMonday(today);
  const { weekDates, habits } = await getWeekData(weekStart);
  const activeHabits = habits.filter((h) => !h.archived);

  return (
    <WeekView
      weekDates={weekDates}
      habits={activeHabits}
      allHabits={habits}
      initialWeekStart={weekStart}
      todayISO={today}
    />
  );
}
