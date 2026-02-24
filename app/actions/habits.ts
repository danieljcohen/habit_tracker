"use server";

import { prisma } from "@/lib/db";
import {
  createHabitSchema,
  updateHabitSchema,
  habitIdSchema,
  type CreateHabitInput,
  type UpdateHabitInput,
} from "@/lib/validations";

export async function createHabit(input: CreateHabitInput) {
  const data = createHabitSchema.parse(input);
  const habit = await prisma.habit.create({
    data: {
      name: data.name,
      targetPerWeek: data.targetPerWeek,
    },
  });
  return { success: true as const, habit };
}

export async function updateHabit(input: UpdateHabitInput) {
  const data = updateHabitSchema.parse(input);
  await prisma.habit.update({
    where: { id: data.id },
    data: { name: data.name, targetPerWeek: data.targetPerWeek },
  });
  return { success: true as const };
}

export async function toggleArchiveHabit(input: { id: string }) {
  const { id } = habitIdSchema.parse(input);
  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit) return { success: false as const, error: "Habit not found" };
  await prisma.habit.update({
    where: { id },
    data: { archived: !habit.archived },
  });
  return { success: true as const };
}
