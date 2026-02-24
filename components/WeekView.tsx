"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HabitWithCounts } from "@/app/actions/week-data";
import {
  createHabit,
  updateHabit,
  toggleArchiveHabit,
} from "@/app/actions/habits";
import { formatShortDay, formatDayNum, formatWeekRange } from "@/lib/date-utils";
import { getWeekStartMonday } from "@/lib/timezone";

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
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState(1);
  const [pending, setPending] = useState<string | null>(null);

  const displayHabits = showArchived ? allHabits : initialHabits;
  const manageHabits = allHabits;

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

  async function handleCreateHabit(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || pending) return;
    if (newTarget < 1) return;
    setPending("create");
    const result = await createHabit({ name, targetPerWeek: newTarget });
    setPending(null);
    if (result.success && result.habit) {
      setNewName("");
      setNewTarget(1);
      router.refresh();
    }
  }

  function startEdit(h: HabitWithCounts) {
    setEditingId(h.id);
    setEditName(h.name);
    setEditTarget(h.targetPerWeek);
  }

  async function saveEdit() {
    if (!editingId || pending) return;
    setPending(editingId);
    await updateHabit({
      id: editingId,
      name: editName.trim(),
      targetPerWeek: editTarget,
    });
    setPending(null);
    setEditingId(null);
    router.refresh();
  }

  async function handleArchive(id: string) {
    if (pending) return;
    setPending(id);
    await toggleArchiveHabit({ id });
    setPending(null);
    router.refresh();
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Manage habits: add + list with edit/archive */}
      <section className="mb-6 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
          Habits
        </h2>
        <form onSubmit={handleCreateHabit} className="mb-4">
          <div className="flex gap-2 flex-wrap items-end">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Habit name"
              className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={pending !== null}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                Days/week:
              </label>
              <input
                type="number"
                min={1}
                max={7}
                value={newTarget}
                onChange={(e) => setNewTarget(parseInt(e.target.value, 10) || 1)}
                className="w-12 px-2 py-1.5 rounded border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
                disabled={pending !== null}
              />
            </div>
            <button
              type="submit"
              disabled={!newName.trim() || pending !== null}
              className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium"
            >
              Add
            </button>
          </div>
        </form>
        <ul className="space-y-2">
          {manageHabits.map((h) => (
            <li
              key={h.id}
              className={`flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-stone-200 dark:border-stone-700 ${
                h.archived ? "opacity-60" : ""
              }`}
            >
              {editingId === h.id ? (
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 min-w-[100px] px-2 py-1.5 rounded border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
                    autoFocus
                  />
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={editTarget}
                    onChange={(e) =>
                      setEditTarget(parseInt(e.target.value, 10) || 1)
                    }
                    className="w-12 px-2 py-1 rounded border border-stone-300 dark:border-stone-600 text-sm"
                  />
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={pending !== null}
                    className="px-2 py-1 rounded bg-teal-600 text-white text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-2 py-1 rounded border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {h.name}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 ml-2">
                      {h.targetPerWeek} days/week
                      {h.archived && " · Archived"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(h)}
                      disabled={pending !== null}
                      className="p-1.5 rounded text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
                      aria-label="Edit"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(h.id)}
                      disabled={pending !== null}
                      className="p-1.5 rounded text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
                      aria-label={h.archived ? "Unarchive" : "Archive"}
                    >
                      {h.archived ? "↩" : "📦"}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        {manageHabits.length === 0 && (
          <p className="text-sm text-stone-500 dark:text-stone-400 py-2">
            No habits yet. Add one above.
          </p>
        )}
      </section>

      {/* Week progress (read-only) */}
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
                    width: `${h.targetPerWeek ? Math.min(100, (h.countThisWeek / h.targetPerWeek) * 100) : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400 w-14 text-right">
                {h.countThisWeek}/{h.targetPerWeek}
              </span>
            </div>
          ))}
          {displayHabits.length === 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No habits. Add one above.
            </p>
          )}
        </div>
      </section>

      {/* Week navigation */}
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

      {/* Week grid (read-only) */}
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
                  const done = (h.countsByDay[date] ?? 0) >= 1;
                  const skipped = h.skippedByDay[date] ?? false;
                  const isToday = date === todayISO;
                  return (
                    <td key={date} className="py-1 px-1 text-center">
                      <div
                        className={`w-10 h-10 rounded-lg border text-sm font-medium flex items-center justify-center mx-auto ${
                          skipped
                            ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                            : done
                              ? "bg-teal-500 dark:bg-teal-600 text-white border-teal-600 dark:border-teal-500"
                              : isToday
                                ? "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800 text-stone-800 dark:text-stone-200"
                                : "bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {skipped ? "—" : done ? "✓" : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
        Check off habits in To-dos for each day.
      </p>
    </div>
  );
}
