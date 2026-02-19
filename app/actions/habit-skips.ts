"use server";

import { prisma } from "@/lib/db";
import { skipHabitSchema, unskipHabitSchema } from "@/lib/validations";

export async function skipHabit(habitId: string, dateISO: string) {
  const data = skipHabitSchema.parse({ habitId, dateISO });
  const skippedDate = new Date(data.dateISO + "T12:00:00");
  await prisma.habitSkip.upsert({
    where: {
      habitId_skippedDate: { habitId: data.habitId, skippedDate },
    },
    create: { habitId: data.habitId, skippedDate },
    update: {},
  });
  return { success: true as const };
}

export async function unskipHabit(habitId: string, dateISO: string) {
  const data = unskipHabitSchema.parse({ habitId, dateISO });
  const skippedDate = new Date(data.dateISO + "T12:00:00");
  await prisma.habitSkip.deleteMany({
    where: { habitId: data.habitId, skippedDate },
  });
  return { success: true as const };
}
