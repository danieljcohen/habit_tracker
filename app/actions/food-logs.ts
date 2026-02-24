"use server";

import { prisma } from "@/lib/db";
import { logHabitCompletion } from "@/app/actions/habit-logs";
import {
  addFoodEntrySchema,
  deleteFoodEntrySchema,
  listFoodSchema,
  type FoodCategory,
} from "@/lib/validations";

export type FoodEntry = {
  id: string;
  dateISO: string;
  category: FoodCategory;
  description: string;
  createdAt: Date;
};

export async function addFoodEntry(input: {
  dateISO: string;
  category: FoodCategory;
  description: string;
}) {
  const data = addFoodEntrySchema.parse(input);
  const entry = await prisma.foodLog.create({
    data: {
      dateISO: data.dateISO,
      category: data.category,
      description: data.description.trim(),
    },
  });
  return {
    success: true as const,
    entry: {
      id: entry.id,
      dateISO: entry.dateISO,
      category: entry.category as FoodCategory,
      description: entry.description,
      createdAt: entry.createdAt,
    },
  };
}

export async function deleteFoodEntry(input: { id: string }) {
  const { id } = deleteFoodEntrySchema.parse(input);
  await prisma.foodLog.delete({ where: { id } });
  return { success: true as const };
}

export async function listFoodForDay(input: { dateISO: string }) {
  const { dateISO } = listFoodSchema.parse(input);
  const entries = await prisma.foodLog.findMany({
    where: { dateISO },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });
  return {
    entries: entries.map((e) => ({
      id: e.id,
      dateISO: e.dateISO,
      category: e.category as FoodCategory,
      description: e.description,
      createdAt: e.createdAt,
    })),
  };
}

const FOOD_HABIT_NAME = "Log food";

export async function submitFoodForDay(input: { dateISO: string }) {
  const { dateISO } = listFoodSchema.parse(input);

  // Ensure the \"Log food\" habit exists with target 7 days/week.
  let habit = await prisma.habit.findFirst({
    where: { name: FOOD_HABIT_NAME },
  });
  if (!habit) {
    const maxOrder = await prisma.habit.aggregate({
      _max: { sortOrder: true },
    });
    habit = await prisma.habit.create({
      data: {
        name: FOOD_HABIT_NAME,
        targetPerWeek: 7,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
  }

  const result = await logHabitCompletion(habit.id, dateISO);
  return result;
}
