"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MonthMetric } from "@/app/actions/metrics";
import type { WeightEntry } from "@/app/actions/weight-logs";
import { addWeightEntry } from "@/app/actions/weight-logs";
import { todayISO } from "@/lib/date-utils";

type MetricsViewProps = {
  monthMetrics: MonthMetric[];
  weightEntries: WeightEntry[];
};

function pct(completed: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((completed / total) * 100);
}

function buildWeightSeries(entries: WeightEntry[]): {
  points: string;
  min: number | null;
  max: number | null;
} {
  if (entries.length === 0) {
    return { points: "", min: null, max: null };
  }
  const weights = entries.map((e) => e.weightKg * 2.2046226218);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  if (min === max) {
    const xs = entries.map((_, i) =>
      entries.length === 1 ? 50 : (i / (entries.length - 1)) * 100,
    );
    const ys = xs.map(() => 50);
    const pts = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
    return { points: pts, min, max };
  }
  const pts = entries
    .map((e, i) => {
      const wLbs = e.weightKg * 2.2046226218;
      const x =
        entries.length === 1 ? 50 : (i / (entries.length - 1 || 1)) * 100;
      const norm = (wLbs - min) / (max - min);
      const y = 100 - norm * 80 - 10; // keep some padding top/bottom
      return `${x},${y}`;
    })
    .join(" ");
  return { points: pts, min, max };
}

export function MetricsView({ monthMetrics, weightEntries }: MetricsViewProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<WeightEntry[]>(weightEntries);
  const [newWeight, setNewWeight] = useState<string>("");
  const [newWeightDate, setNewWeightDate] = useState<string>(todayISO());
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setEntries(weightEntries);
  }, [weightEntries]);

  const { points, min, max } = buildWeightSeries(entries);

  async function handleAddWeight(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    const lbs = parseFloat(newWeight);
    if (!Number.isFinite(lbs) || lbs <= 0) return;
    const dateISO =
      newWeightDate && /^\d{4}-\d{2}-\d{2}$/.test(newWeightDate)
        ? newWeightDate
        : todayISO();
    setPending(true);
    const kg = lbs * 0.45359237;
    const result = await addWeightEntry({ dateISO, weightKg: kg });
    setPending(false);
    if (!result.success || !result.entry) {
      router.refresh();
      return;
    }
    setEntries((prev) =>
      [...prev, result.entry!].sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    );
    setNewWeight("");
    router.refresh();
  }
  return (
    <div className="p-4 max-w-xl mx-auto pb-24">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-6">
        Metrics
      </h1>

      {/* Weight graph */}
      <section className="mb-6 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <h2 className="text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
          Weight
        </h2>
        <form
          onSubmit={handleAddWeight}
          className="mb-3 flex flex-wrap gap-2 items-end text-xs"
        >
          <div className="flex items-center gap-1.5">
            <label className="text-stone-600 dark:text-stone-400">
              Today&apos;s weight:
            </label>
            <input
              type="number"
              step="0.1"
              min={1}
              max={400}
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="w-20 px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            />
            <span className="text-stone-500 dark:text-stone-400">lb</span>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-stone-600 dark:text-stone-400">Date:</label>
            <input
              type="date"
              value={newWeightDate}
              onChange={(e) => setNewWeightDate(e.target.value)}
              className="px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            />
          </div>
          <button
            type="submit"
            disabled={!newWeight.trim() || pending}
            className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium"
          >
            Log
          </button>
        </form>
        {entries.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            No weight entries yet. Log your weight every so often to see a trend
            here.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="w-full h-24 bg-stone-50 dark:bg-stone-900/40 rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-teal-500 dark:text-teal-400"
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  points={points}
                />
              </svg>
            </div>
            {/* X-axis dates: start / middle / end */}
            <div className="flex justify-between text-[10px] text-stone-400 dark:text-stone-500 px-1">
              {entries.length > 0 && (
                <span>{entries[0].dateISO}</span>
              )}
              {entries.length > 2 && (
                <span>
                  {entries[Math.floor(entries.length / 2)].dateISO}
                </span>
              )}
              {entries.length > 1 && (
                <span>{entries[entries.length - 1].dateISO}</span>
              )}
            </div>
            <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>
                Latest:{" "}
                <span className="font-medium text-stone-800 dark:text-stone-100">
                  {(
                    (entries[entries.length - 1]?.weightKg ?? 0) * 2.2046226218
                  ).toFixed(1)}{" "}
                  lb
                </span>
              </span>
              {min !== null && max !== null && (
                <span>
                  Range:{" "}
                  <span className="font-medium text-stone-800 dark:text-stone-100">
                    {min.toFixed(1)}–{max.toFixed(1)} lb
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {monthMetrics.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          No month metrics yet. Log habits or add tasks in a month to see stats
          here.
        </p>
      ) : (
        <div className="space-y-4">
          {monthMetrics.map((m) => {
            const habitPct = pct(m.habitWeeksMet, m.habitWeeksTotal);
            const taskPct = pct(m.tasksCompleted, m.tasksTotal);
            return (
              <div
                key={m.monthKey}
                className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4"
              >
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-3">
                  {m.monthLabel}
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-stone-600 dark:text-stone-400">
                        Habits
                      </span>
                      <span className="font-medium text-stone-900 dark:text-stone-100">
                        {habitPct !== null ? `${habitPct}%` : "—"}
                      </span>
                    </div>
                    <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 dark:bg-teal-600 rounded-full transition-all"
                        style={{
                          width: `${habitPct !== null ? habitPct : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-stone-600 dark:text-stone-400">
                        To-dos
                      </span>
                      <span className="font-medium text-stone-900 dark:text-stone-100">
                        {taskPct !== null ? `${taskPct}%` : "—"}
                      </span>
                    </div>
                    <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 dark:bg-blue-600 rounded-full transition-all"
                        style={{
                          width: `${taskPct !== null ? taskPct : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
