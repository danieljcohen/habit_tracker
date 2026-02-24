"use server";

import { prisma } from "@/lib/db";
import { logHabitSchema, unlogHabitSchema } from "@/lib/validations";
import {
  localDayStartUTC,
  localDayEndUTC,
  utcToLocalDateString,
  getWeekStartMonday,
} from "@/lib/timezone";

function getDateISO(dateISO?: string): string {
  if (dateISO) return dateISO;
  return utcToLocalDateString(new Date());
}

function invalidateForDate(localDate: string) {
  const weekStart = getWeekStartMonday(localDate);
  // No-op for now; left in place for potential future tag-based invalidation.
}

export async function logHabitCompletion(habitId: string, dateISO?: string) {
  const data = logHabitSchema.parse({ habitId, dateISO });
  const localDate = getDateISO(data.dateISO);
  const start = localDayStartUTC(localDate);
  const end = localDayEndUTC(localDate);
  const existing = await prisma.habitLog.findFirst({
    where: {
      habitId: data.habitId,
      occurredAt: { gte: start, lte: end },
    },
  });
  if (existing) {
    return { success: false as const, error: "Already logged for this day" };
  }
  const occurredAt = start;
  await prisma.habitLog.create({
    data: { habitId: data.habitId, occurredAt },
  });
  invalidateForDate(localDate);
  return { success: true as const };
}

export async function unlogHabitCompletion(habitId: string, dateISO?: string) {
  const data = unlogHabitSchema.parse({ habitId, dateISO });
  const localDate = getDateISO(data.dateISO);
  const start = localDayStartUTC(localDate);
  const end = localDayEndUTC(localDate);
  const latest = await prisma.habitLog.findFirst({
    where: {
      habitId: data.habitId,
      occurredAt: { gte: start, lte: end },
    },
    orderBy: { occurredAt: "desc" },
  });
  if (!latest) return { success: false as const, error: "No log to undo" };
  await prisma.habitLog.delete({ where: { id: latest.id } });
  invalidateForDate(localDate);
  return { success: true as const };
}

