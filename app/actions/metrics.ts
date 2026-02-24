"use server";

import { prisma } from "@/lib/db";
import {
  getWeekStartMonday,
  getWeekDates,
  localDayStartUTC,
  localDayEndUTC,
} from "@/lib/timezone";
import { subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { memoizeAsync } from "@/lib/memo-cache";

export type MonthMetric = {
  monthKey: string;
  monthLabel: string;
  tasksCompleted: number;
  tasksTotal: number;
  habitWeeksMet: number;
  habitWeeksTotal: number;
};

/** Months that have started (current + past), max 12. Only includes months with activity (habit logs or tasks). */
export async function getMonthMetrics(monthsBack: number = 12) {
  return memoizeAsync(
    "monthMetrics",
    60_000,
    async () => {
      const metrics: MonthMetric[] = [];
      const now = new Date();
      const habitsList = await prisma.habit.findMany({
        where: { archived: false },
        select: { id: true, targetPerWeek: true },
      });
      const habitIds = habitsList.map((h) => h.id);
      const habitTargets = Object.fromEntries(
        habitsList.map((h) => [h.id, h.targetPerWeek]),
      );

      for (let i = 0; i < monthsBack; i++) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(monthStart);
        const monthKey = format(monthStart, "yyyy-MM");
        const monthLabel = format(monthStart, "MMMM yyyy");

        const monthStartUTC = localDayStartUTC(
          format(monthStart, "yyyy-MM-dd"),
        );
        const monthEndUTC = localDayEndUTC(format(monthEnd, "yyyy-MM-dd"));

        const [habitLogCount, tasksInMonth] = await Promise.all([
          prisma.habitLog.count({
            where: {
              occurredAt: { gte: monthStartUTC, lte: monthEndUTC },
            },
          }),
          prisma.task.findMany({
            where: {
              dueDate: { gte: monthStart, lte: monthEnd },
            },
          }),
        ]);
        const hasActivity = habitLogCount > 0 || tasksInMonth.length > 0;
        if (!hasActivity) continue;

        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const weekStarts = new Set<string>();
        for (const day of monthDays) {
          const dateStr = format(day, "yyyy-MM-dd");
          const mon = getWeekStartMonday(dateStr);
          weekStarts.add(mon);
        }
        const numWeeks = weekStarts.size;
        let habitWeeksMet = 0;
        const habitWeeksTotal = habitIds.length * numWeeks;
        for (const weekStart of weekStarts) {
          const dates = getWeekDates(weekStart);
          const weekStartUTC = localDayStartUTC(dates[0]);
          const weekEndUTC = localDayEndUTC(dates[dates.length - 1]);
          for (const hid of habitIds) {
            const target = habitTargets[hid] ?? 1;
            const count = await prisma.habitLog.count({
              where: {
                habitId: hid,
                occurredAt: { gte: weekStartUTC, lte: weekEndUTC },
              },
            });
            if (count >= target) habitWeeksMet++;
          }
        }

        metrics.push({
          monthKey,
          monthLabel,
          tasksCompleted: tasksInMonth.filter((t) => t.completed).length,
          tasksTotal: tasksInMonth.length,
          habitWeeksMet,
          habitWeeksTotal,
        });
      }
      return metrics;
    },
  );
}

