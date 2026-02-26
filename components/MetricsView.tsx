"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MonthMetric } from "@/app/actions/metrics";
import type { WeightEntry } from "@/app/actions/weight-logs";
import type { DietScore } from "@prisma/client";
import { addWeightEntry } from "@/app/actions/weight-logs";
import { todayISO } from "@/lib/date-utils";

type MetricsViewProps = {
  monthMetrics: MonthMetric[];
  weightEntries: WeightEntry[];
  dietScores: DietScore[];
};

function pct(completed: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((completed / total) * 100);
}

function buildWeightSeries(entries: WeightEntry[]): {
  polyline: string;
  coords: { x: number; y: number; lbs: number; dateISO: string }[];
  min: number | null;
  max: number | null;
} {
  if (entries.length === 0) {
    return { polyline: "", coords: [], min: null, max: null };
  }
  const weights = entries.map((e) => e.weightKg * 2.2046226218);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const coords = entries.map((e, i) => {
    const wLbs = e.weightKg * 2.2046226218;
    const x = entries.length === 1 ? 50 : (i / (entries.length - 1 || 1)) * 100;
    let y: number;
    if (min === max) {
      y = 50;
    } else {
      const norm = (wLbs - min) / (max - min);
      y = 100 - norm * 70 - 15; // keep some padding top/bottom
    }
    return { x, y, lbs: wLbs, dateISO: e.dateISO };
  });
  const polyline = coords.map((p) => `${p.x},${p.y}`).join(" ");
  return { polyline, coords, min, max };
}

export function MetricsView({
  monthMetrics,
  weightEntries,
  dietScores,
}: MetricsViewProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<WeightEntry[]>(weightEntries);
  const [newWeight, setNewWeight] = useState<string>("");
  const [newWeightDate, setNewWeightDate] = useState<string>(todayISO());
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setEntries(weightEntries);
  }, [weightEntries]);

  const { polyline, coords, min, max } = buildWeightSeries(entries);

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
            <div className="relative w-full h-44 bg-stone-50 dark:bg-stone-900/40 rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-3">
              {min !== null && max !== null && (
                <div className="absolute left-0 top-3 bottom-3 w-3 flex flex-col justify-between pointer-events-none">
                  {(() => {
                    const steps = 5;
                    const labels: string[] = [];
                    for (let i = 0; i < steps; i++) {
                      const v = max - (i / (steps - 1)) * (max - min);
                      labels.push(v.toFixed(0));
                    }
                    if (min === max) return null;
                    return labels.map((l, i) => (
                      <span
                        key={i}
                        className="text-[8px] leading-none text-stone-400 dark:text-stone-500 text-right w-full"
                      >
                        {l}
                      </span>
                    ));
                  })()}
                </div>
              )}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-teal-500 dark:text-teal-400"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern id="weightGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      className="stroke-stone-300 dark:stroke-stone-600"
                      strokeWidth="0.3"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#weightGrid)" />
                {[15, 32.5, 50, 67.5, 85].map((y) => (
                  <line
                    key={y}
                    x1="0" y1={y} x2="100" y2={y}
                    className="stroke-stone-300 dark:stroke-stone-600"
                    strokeWidth="0.25"
                    strokeDasharray="1.5 1"
                  />
                ))}
                <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                </linearGradient>
                {coords.length > 1 && (
                  <polygon
                    fill="url(#weightFill)"
                    points={`${coords[0].x},100 ${polyline} ${coords[coords.length - 1].x},100`}
                  />
                )}
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={polyline}
                />
                {coords.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={1.4}
                    fill="currentColor"
                  />
                ))}
              </svg>
            </div>
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
              {entries.length >= 2 && (() => {
                const firstLbs = entries[0].weightKg * 2.2046226218;
                const lastLbs = entries[entries.length - 1].weightKg * 2.2046226218;
                const diff = firstLbs - lastLbs;
                const absDiff = Math.abs(diff).toFixed(1);
                return (
                  <span>
                    {diff >= 0 ? (
                      <>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          −{absDiff} lb
                        </span>{" "}
                        lost
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-red-500 dark:text-red-400">
                          +{absDiff} lb
                        </span>{" "}
                        gained
                      </>
                    )}
                  </span>
                );
              })()}
            </div>
          </div>
        )}
      </section>

      {/* Diet scores */}
      <section className="mb-6 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <h2 className="text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
          Diet scores
        </h2>
        {dietScores.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            No diet scores yet. Submit your food for the day to get a 1–5
            score.
          </p>
        ) : (
          <div className="space-y-2">
            <ul className="space-y-1.5 text-xs">
              {dietScores.map((d) => (
                <li
                  key={d.dateISO}
                  className="flex items-start justify-between gap-2 py-1.5 px-2 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700"
                >
                  <span className="text-stone-600 dark:text-stone-300">
                    {d.dateISO}
                  </span>
                  <div className="flex-1 flex flex-col items-end gap-0.5">
                    <span className="inline-flex items-center gap-1 text-stone-800 dark:text-stone-100">
                      <span className="font-semibold">{d.score}</span>
                      <span className="text-[10px] uppercase tracking-wide text-stone-400 dark:text-stone-500">
                        /5
                      </span>
                    </span>
                    {d.note && (
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 text-right">
                        {d.note}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
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
