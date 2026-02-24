"use server";

import { prisma } from "@/lib/db";
import {
  getWeekStartMonday,
  getWeekDates,
  localDayStartUTC,
  localDayEndUTC,
  utcToLocalDateString,
} from "@/lib/timezone";
import {
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";

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

    const [monthLogs, tasksInMonth] = await Promise.all([
      habitIds.length
        ? prisma.habitLog.findMany({
            where: {
              habitId: { in: habitIds },
              occurredAt: { gte: monthStartUTC, lte: monthEndUTC },
            },
            select: {
              habitId: true,
              occurredAt: true,
            },
          })
        : Promise.resolve([] as { habitId: string; occurredAt: Date }[]),
      prisma.task.findMany({
        where: {
          dueDate: { gte: monthStart, lte: monthEnd },
        },
        select: {
          id: true,
          completed: true,
        },
      }),
    ]);
    const hasActivity = monthLogs.length > 0 || tasksInMonth.length > 0;
    if (!hasActivity) continue;

    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const weekStarts = new Set<string>();
    for (const day of monthDays) {
      const dateStr = format(day, "yyyy-MM-dd");
      const mon = getWeekStartMonday(dateStr);
      weekStarts.add(mon);
    }
    const numWeeks = weekStarts.size;
    const habitWeeksTotal = habitIds.length * numWeeks;

    const completionsByHabitAndWeek = new Map<string, number>();
    for (const log of monthLogs) {
      const localDate = utcToLocalDateString(log.occurredAt);
      const weekStart = getWeekStartMonday(localDate);
      if (!weekStarts.has(weekStart)) continue;
      const key = `${log.habitId}|${weekStart}`;
      const current = completionsByHabitAndWeek.get(key) ?? 0;
      completionsByHabitAndWeek.set(key, current + 1);
    }

    let habitWeeksMet = 0;
    for (const weekStart of weekStarts) {
      for (const hid of habitIds) {
        const target = habitTargets[hid] ?? 1;
        const key = `${hid}|${weekStart}`;
        const count = completionsByHabitAndWeek.get(key) ?? 0;
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
}

