"use client";

import type { MonthMetric } from "@/app/actions/metrics";

type MetricsViewProps = {
  monthMetrics: MonthMetric[];
};

function pct(completed: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((completed / total) * 100);
}

export function MetricsView({ monthMetrics }: MetricsViewProps) {
  return (
    <div className="p-4 max-w-xl mx-auto pb-24">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-6">
        Metrics
      </h1>

      {monthMetrics.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          No metrics yet. Log habits or add tasks in a month to see stats here.
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
