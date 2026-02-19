"use server";

import { prisma } from "@/lib/db";
import {
  getWeekStartMonday,
  getWeekDates,
  localDayStartUTC,
  localDayEndUTC,
} from "@/lib/timezone";
import { subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export type WeekMetric = {
  weekStart: string;
  weekLabel: string;
  habitsMet: number; // count of habit-days where count >= target
  habitsTotal: number; // total habit-days (habits * 7)
  tasksCompleted: number;
  tasksTotal: number;
};

export type MonthMetric = {
  monthKey: string;
  monthLabel: string;
  tasksCompleted: number;
  tasksTotal: number;
  habitDaysMet: number;
  habitDaysTotal: number;
};

/** Last N weeks of habit + task completion for dashboard */
export async function getWeekMetrics(weeksBack: number = 8) {
  const today = format(new Date(), "yyyy-MM-dd");
  const thisWeekStart = getWeekStartMonday(today);
  const metrics: WeekMetric[] = [];
  const habitsList = await prisma.habit.findMany({ where: { archived: false }, select: { id: true, targetPerDay: true } });
  const habitIds = habitsList.map((h) => h.id);
  const habitTargets = Object.fromEntries(habitsList.map((h) => [h.id, h.targetPerDay]));

  for (let i = 0; i < weeksBack; i++) {
    const d = new Date(thisWeekStart + "T12:00:00");
    d.setDate(d.getDate() - 7 * i);
    const weekStart = format(d, "yyyy-MM-dd");
    const dates = getWeekDates(weekStart);
    let habitsMet = 0;
    let habitsTotal = habitIds.length * 7;
    for (const date of dates) {
      const rangeStart = localDayStartUTC(date);
      const rangeEnd = localDayEndUTC(date);
      for (const hid of habitIds) {
        const target = habitTargets[hid] ?? 1;
        const count = await prisma.habitLog.count({
          where: {
            habitId: hid,
            occurredAt: { gte: rangeStart, lte: rangeEnd },
          },
        });
        if (count >= target) habitsMet++;
      }
    }
    const weekStartDate = new Date(weekStart + "T00:00:00");
    const weekEndDate = new Date(weekStart + "T00:00:00");
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    const tasksInWeek = await prisma.task.findMany({
      where: {
        dueDate: { gte: weekStartDate, lt: weekEndDate },
      },
    });
    const tasksCompleted = tasksInWeek.filter((t) => t.completed).length;
    metrics.push({
      weekStart,
      weekLabel: `Week of ${format(new Date(weekStart + "T12:00:00"), "MMM d")}`,
      habitsMet,
      habitsTotal,
      tasksCompleted,
      tasksTotal: tasksInWeek.length,
    });
  }
  return metrics;
}

/** Last N months aggregate (tasks + habit days) */
export async function getMonthMetrics(monthsBack: number = 6) {
  const metrics: MonthMetric[] = [];
  const now = new Date();
  const habitsList = await prisma.habit.findMany({ where: { archived: false }, select: { id: true, targetPerDay: true } });
  const habitIds = habitsList.map((h) => h.id);
  const habitTargets = Object.fromEntries(habitsList.map((h) => [h.id, h.targetPerDay]));

  for (let i = 0; i < monthsBack; i++) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(monthStart);
    const monthKey = format(monthStart, "yyyy-MM");
    const monthLabel = format(monthStart, "MMMM yyyy");
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    let habitDaysMet = 0;
    let habitDaysTotal = habitIds.length * days.length;
    for (const day of days) {
      const dateStr = format(day, "yyyy-MM-dd");
      const rangeStart = localDayStartUTC(dateStr);
      const rangeEnd = localDayEndUTC(dateStr);
      for (const hid of habitIds) {
        const target = habitTargets[hid] ?? 1;
        const count = await prisma.habitLog.count({
          where: {
            habitId: hid,
            occurredAt: { gte: rangeStart, lte: rangeEnd },
          },
        });
        if (count >= target) habitDaysMet++;
      }
    }
    const tasksInMonth = await prisma.task.findMany({
      where: {
        dueDate: { gte: monthStart, lte: monthEnd },
      },
    });
    metrics.push({
      monthKey,
      monthLabel,
      tasksCompleted: tasksInMonth.filter((t) => t.completed).length,
      tasksTotal: tasksInMonth.length,
      habitDaysMet,
      habitDaysTotal,
    });
  }
  return metrics;
}
