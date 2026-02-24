"use server";

import { prisma } from "@/lib/db";
import { weekDataSchema } from "@/lib/validations";
import {
  getWeekDates,
  localDayStartUTC,
  localDayEndUTC,
} from "@/lib/timezone";

export type HabitWithCounts = {
  id: string;
  name: string;
  targetPerWeek: number;
  archived: boolean;
  countsByDay: Record<string, number>;
  skippedByDay: Record<string, boolean>;
  /** Total completions this week (for weekly target) */
  countThisWeek: number;
  /** Whether the weekly target was met */
  weekMet: boolean;
};

export async function getWeekData(weekStartISO: string) {
  const { weekStartISO: start } = weekDataSchema.parse({ weekStartISO });
  const dates = getWeekDates(start);
  const habits = await prisma.habit.findMany({
    orderBy: { createdAt: "asc" },
    include: { skips: true },
  });
  const habitIds = habits.map((h) => h.id);
  const countsByHabitAndDay: Record<string, Record<string, number>> = {};
  const skippedByHabitAndDay: Record<string, Record<string, boolean>> = {};
  for (const h of habits) {
    countsByHabitAndDay[h.id] = {};
    skippedByHabitAndDay[h.id] = {};
    for (const date of dates) {
      countsByHabitAndDay[h.id][date] = 0;
      skippedByHabitAndDay[h.id][date] = false;
    }
  }
  for (const date of dates) {
    const rangeStart = localDayStartUTC(date);
    const rangeEnd = localDayEndUTC(date);
    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: { in: habitIds },
        occurredAt: { gte: rangeStart, lte: rangeEnd },
      },
    });
    for (const log of logs) {
      const current = countsByHabitAndDay[log.habitId][date] ?? 0;
      countsByHabitAndDay[log.habitId][date] = Math.min(current + 1, 1);
    }
  }
  for (const h of habits) {
    for (const skip of h.skips) {
      const d = skip.skippedDate.toISOString().slice(0, 10);
      if (skippedByHabitAndDay[h.id] && d in skippedByHabitAndDay[h.id]) {
        skippedByHabitAndDay[h.id][d] = true;
      }
    }
  }
  const result: HabitWithCounts[] = habits.map((h) => {
    let countThisWeek = 0;
    for (const date of dates) {
      countThisWeek += Math.min(countsByHabitAndDay[h.id][date] ?? 0, 1);
    }
    return {
      id: h.id,
      name: h.name,
      targetPerWeek: h.targetPerWeek,
      archived: h.archived,
      countsByDay: countsByHabitAndDay[h.id],
      skippedByDay: skippedByHabitAndDay[h.id],
      countThisWeek,
      weekMet: countThisWeek >= h.targetPerWeek,
    };
  });
  return { weekDates: dates, habits: result };
}
