"use server";

import { prisma } from "@/lib/db";
import { weekDataSchema } from "@/lib/validations";
import {
  getWeekDates,
  localDayStartUTC,
  localDayEndUTC,
  utcToLocalDateString,
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
  const dateSet = new Set(dates);
  const habits = await prisma.habit.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      targetPerWeek: true,
      archived: true,
      skips: {
        select: { skippedDate: true },
      },
    },
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
  if (habitIds.length > 0) {
    const weekStartUTC = localDayStartUTC(dates[0]);
    const weekEndUTC = localDayEndUTC(dates[dates.length - 1]);
    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: { in: habitIds },
        occurredAt: { gte: weekStartUTC, lte: weekEndUTC },
      },
      select: {
        habitId: true,
        occurredAt: true,
      },
    });
    for (const log of logs) {
      const localDate = utcToLocalDateString(log.occurredAt);
      if (!dateSet.has(localDate)) continue;
      const current = countsByHabitAndDay[log.habitId][localDate] ?? 0;
      countsByHabitAndDay[log.habitId][localDate] = Math.min(current + 1, 1);
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

