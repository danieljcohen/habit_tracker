"use server";

import { prisma } from "@/lib/db";
import {
  createHabitSchema,
  updateHabitSchema,
  habitIdSchema,
  type CreateHabitInput,
  type UpdateHabitInput,
} from "@/lib/validations";
import { z } from "zod";

const reorderHabitsSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export async function createHabit(input: CreateHabitInput) {
  const data = createHabitSchema.parse(input);
  const maxOrder = await prisma.habit.aggregate({
    _max: { sortOrder: true },
  });
  const habit = await prisma.habit.create({
    data: {
      name: data.name,
      targetPerWeek: data.targetPerWeek,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
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

export async function reorderHabits(input: { ids: string[] }) {
  const { ids } = reorderHabitsSchema.parse(input);
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.habit.update({
        where: { id },
        data: { sortOrder: index + 1 },
      }),
    ),
  );
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
