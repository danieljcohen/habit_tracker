"use client";

import type { WeekMetric, MonthMetric } from "@/app/actions/metrics";

type MetricsViewProps = {
  weekMetrics: WeekMetric[];
  monthMetrics: MonthMetric[];
};

function barPct(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function MetricsView({ weekMetrics, monthMetrics }: MetricsViewProps) {
  return (
    <div className="p-4 max-w-xl mx-auto pb-24">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-6">
        Metrics
      </h1>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
          By week (habits + to-dos)
        </h2>
        <div className="space-y-4">
          {weekMetrics.map((w) => {
            const habitPct = barPct(w.habitsMet, w.habitsTotal);
            const taskPct = w.tasksTotal > 0 ? barPct(w.tasksCompleted, w.tasksTotal) : 0;
            return (
              <div
                key={w.weekStart}
                className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4"
              >
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-3">
                  {w.weekLabel}
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                      <span>Habits (days met)</span>
                      <span>{w.habitsMet} / {w.habitsTotal}</span>
                    </div>
                    <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 dark:bg-teal-600 rounded-full"
                        style={{ width: `${habitPct}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                      <span>To-dos completed</span>
                      <span>{w.tasksCompleted} / {w.tasksTotal}</span>
                    </div>
                    <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 dark:bg-blue-600 rounded-full"
                        style={{ width: `${taskPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
          By month (long-term)
        </h2>
        <div className="space-y-4">
          {monthMetrics.map((m) => {
            const habitPct = barPct(m.habitDaysMet, m.habitDaysTotal);
            const taskPct = m.tasksTotal > 0 ? barPct(m.tasksCompleted, m.tasksTotal) : 0;
            return (
              <div
                key={m.monthKey}
                className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4"
              >
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-3">
                  {m.monthLabel}
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                      <span>Habit days met</span>
                      <span>{m.habitDaysMet} / {m.habitDaysTotal}</span>
                    </div>
                    <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 dark:bg-teal-600 rounded-full"
                        style={{ width: `${habitPct}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                      <span>To-dos completed</span>
                      <span>{m.tasksCompleted} / {m.tasksTotal}</span>
                    </div>
                    <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 dark:bg-blue-600 rounded-full"
                        style={{ width: `${taskPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
