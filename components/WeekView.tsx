"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HabitWithCounts } from "@/app/actions/week-data";
import { logHabitCompletion, unlogHabitCompletion } from "@/app/actions/habit-logs";
import { skipHabit, unskipHabit } from "@/app/actions/habit-skips";
import { formatShortDay, formatDayNum, formatWeekRange } from "@/lib/date-utils";
import { getWeekStartMonday } from "@/lib/timezone";
import { DayModal } from "./DayModal";

type WeekViewProps = {
  weekDates: string[];
  habits: HabitWithCounts[];
  allHabits: HabitWithCounts[];
  initialWeekStart: string;
  todayISO: string;
};

export function WeekView({
  weekDates,
  habits: initialHabits,
  allHabits,
  initialWeekStart,
  todayISO,
}: WeekViewProps) {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [modal, setModal] = useState<{
    habitId: string;
    habitName: string;
    date: string;
    count: number;
    target: number;
    skipped: boolean;
  } | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const displayHabits = showArchived ? allHabits : initialHabits;

  function goToWeek(weekStart: string) {
    router.push("/?week=" + weekStart);
  }

  function prevWeek() {
    const d = new Date(initialWeekStart + "T12:00:00");
    d.setDate(d.getDate() - 7);
    goToWeek(d.toISOString().slice(0, 10));
  }

  function nextWeek() {
    const d = new Date(initialWeekStart + "T12:00:00");
    d.setDate(d.getDate() + 7);
    goToWeek(d.toISOString().slice(0, 10));
  }

  function thisWeek() {
    const mon = getWeekStartMonday(todayISO);
    goToWeek(mon);
  }

  async function handleLog(habitId: string, date: string) {
    const key = `${habitId}-${date}`;
    if (pending) return;
    setPending(key);
    await logHabitCompletion(habitId, date);
    setPending(null);
    router.refresh();
    if (modal?.habitId === habitId && modal?.date === date) {
      setModal((m) => (m ? { ...m, count: m.count + 1 } : null));
    }
  }

  async function handleUnlog(habitId: string, date: string) {
    const key = `u-${habitId}-${date}`;
    if (pending) return;
    setPending(key);
    const result = await unlogHabitCompletion(habitId, date);
    setPending(null);
    router.refresh();
    if (modal?.habitId === habitId && modal?.date === date && result.success) {
      setModal((m) => (m ? { ...m, count: Math.max(0, m.count - 1) } : null));
    }
  }

  async function handleSkip(habitId: string, date: string) {
    if (pending) return;
    setPending(`s-${habitId}-${date}`);
    await skipHabit(habitId, date);
    setPending(null);
    router.refresh();
    if (modal?.habitId === habitId && modal?.date === date) {
      setModal((m) => (m ? { ...m, skipped: true } : null));
    }
  }

  async function handleUnskip(habitId: string, date: string) {
    if (pending) return;
    setPending(`u-${habitId}-${date}`);
    await unskipHabit(habitId, date);
    setPending(null);
    router.refresh();
    if (modal?.habitId === habitId && modal?.date === date) {
      setModal((m) => (m ? { ...m, skipped: false } : null));
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Week progress bars */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
          Week progress
        </h2>
        <div className="space-y-3">
          {displayHabits.map((h) => (
            <div key={h.id} className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-800 dark:text-stone-200 w-28 truncate">
                {h.name}
              </span>
              <div className="flex-1 h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 dark:bg-teal-600 rounded-full transition-all"
                  style={{
                    width: `${h.daysTotal ? (h.daysMet / h.daysTotal) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400 w-12 text-right">
                {h.daysMet}/{h.daysTotal} days
              </span>
            </div>
          ))}
          {displayHabits.length === 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No habits. Add one in Habits.
            </p>
          )}
        </div>
      </section>

      {/* Today quick controls */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
          Today
        </h2>
        <div className="flex flex-wrap gap-2">
          {initialHabits.map((h) => {
            const count = h.countsByDay[todayISO] ?? 0;
            const met = count >= h.targetPerDay;
            const key = `today-${h.id}`;
            const isPending = pending !== null && pending.includes(h.id);
            return (
              <div
                key={h.id}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  met
                    ? "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800"
                    : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                }`}
              >
                <span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate max-w-[100px]">
                  {h.name}
                </span>
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {count}/{h.targetPerDay}
                </span>
                <button
                  type="button"
                  onClick={() => handleLog(h.id, todayISO)}
                  disabled={isPending}
                  className="w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-lg leading-none flex items-center justify-center"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleUnlog(h.id, todayISO)}
                  disabled={isPending || count === 0}
                  className="w-8 h-8 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-50 text-sm"
                >
                  Undo
                </button>
              </div>
            );
          })}
          {initialHabits.length === 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No habits yet. Add one in Habits.
            </p>
          )}
        </div>
      </section>

      {/* Week controls */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={prevWeek}
          className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium"
        >
          ← Prev
        </button>
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {formatWeekRange(weekDates)}
        </span>
        <button
          type="button"
          onClick={nextWeek}
          className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium"
        >
          Next →
        </button>
      </div>
      <div className="flex justify-center mb-2">
        <button
          type="button"
          onClick={thisWeek}
          className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
        >
          This week
        </button>
      </div>

      <label className="flex items-center gap-2 mb-4 text-sm text-stone-600 dark:text-stone-400">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="rounded border-stone-300"
        />
        Show archived
      </label>

      {/* Week grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[400px]">
          <thead>
            <tr>
              <th className="text-left py-2 pr-2 text-xs font-medium text-stone-500 dark:text-stone-400 w-24">
                Habit
              </th>
              {weekDates.map((d) => (
                <th
                  key={d}
                  className={`py-2 px-1 text-center text-xs font-medium w-12 ${
                    d === todayISO
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-stone-500 dark:text-stone-400"
                  }`}
                >
                  <div>{formatShortDay(d)}</div>
                  <div>{formatDayNum(d)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayHabits.map((h) => (
              <tr
                key={h.id}
                className={`border-t border-stone-200 dark:border-stone-700 ${
                  h.archived ? "opacity-60" : ""
                }`}
              >
                <td className="py-2 pr-2 text-sm font-medium text-stone-800 dark:text-stone-200 truncate max-w-[100px]">
                  {h.name}
                </td>
                {weekDates.map((date) => {
                  const count = h.countsByDay[date] ?? 0;
                  const skipped = h.skippedByDay[date] ?? false;
                  const met = !skipped && count >= h.targetPerDay;
                  const isToday = date === todayISO;
                  return (
                    <td key={date} className="py-1 px-1 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setModal({
                            habitId: h.id,
                            habitName: h.name,
                            date,
                            count,
                            target: h.targetPerDay,
                            skipped,
                          })
                        }
                        className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                          skipped
                            ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                            : met
                              ? "bg-teal-500 dark:bg-teal-600 text-white border-teal-600 dark:border-teal-500"
                              : isToday
                                ? "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800 text-stone-800 dark:text-stone-200"
                                : "bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`}
                      >
                        {skipped ? "—" : count}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <DayModal
          habitName={modal.habitName}
          date={modal.date}
          count={modal.count}
          target={modal.target}
          skipped={modal.skipped}
          onLog={() => handleLog(modal.habitId, modal.date)}
          onUnlog={() => handleUnlog(modal.habitId, modal.date)}
          onSkip={() => handleSkip(modal.habitId, modal.date)}
          onUnskip={() => handleUnskip(modal.habitId, modal.date)}
          onClose={() => setModal(null)}
          pending={pending !== null}
        />
      )}
    </div>
  );
}
