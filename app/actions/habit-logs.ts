"use server";

import { prisma } from "@/lib/db";
import { logHabitSchema, unlogHabitSchema } from "@/lib/validations";
import {
  localDayStartUTC,
  localDayEndUTC,
  utcToLocalDateString,
} from "@/lib/timezone";

function getDateISO(dateISO?: string): string {
  if (dateISO) return dateISO;
  return utcToLocalDateString(new Date());
}

export async function logHabitCompletion(habitId: string, dateISO?: string) {
  const data = logHabitSchema.parse({ habitId, dateISO });
  const localDate = getDateISO(data.dateISO);
  const occurredAt = localDayStartUTC(localDate);
  await prisma.habitLog.create({
    data: { habitId: data.habitId, occurredAt },
  });
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
  return { success: true as const };
}
