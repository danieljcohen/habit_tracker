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
  targetPerDay: number;
  archived: boolean;
  countsByDay: Record<string, number>;
  skippedByDay: Record<string, boolean>;
  /** For week dashboard: days in this week where count >= targetPerDay */
  daysMet: number;
  /** Total days in week (7) */
  daysTotal: number;
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
      countsByHabitAndDay[log.habitId][date] =
        (countsByHabitAndDay[log.habitId][date] ?? 0) + 1;
    }
  }
  const dayDateStrs = dates.map((d) => d);
  for (const h of habits) {
    for (const skip of h.skips) {
      const d = skip.skippedDate.toISOString().slice(0, 10);
      if (skippedByHabitAndDay[h.id] && d in skippedByHabitAndDay[h.id]) {
        skippedByHabitAndDay[h.id][d] = true;
      }
    }
  }
  const result: HabitWithCounts[] = habits.map((h) => {
    let daysMet = 0;
    for (const date of dates) {
      const count = countsByHabitAndDay[h.id][date] ?? 0;
      if (count >= h.targetPerDay) daysMet++;
    }
    return {
      id: h.id,
      name: h.name,
      targetPerDay: h.targetPerDay,
      archived: h.archived,
      countsByDay: countsByHabitAndDay[h.id],
      skippedByDay: skippedByHabitAndDay[h.id],
      daysMet,
      daysTotal: dates.length,
    };
  });
  return { weekDates: dates, habits: result };
}
