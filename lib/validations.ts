import { z } from "zod";

const uuid = z.string().uuid();
const localDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createHabitSchema = z.object({
  name: z.string().min(1).max(200),
  targetPerWeek: z.number().int().min(1).max(7),
});

export const updateHabitSchema = z.object({
  id: uuid,
  name: z.string().min(1).max(200),
  targetPerWeek: z.number().int().min(1).max(7),
});

export const habitIdSchema = z.object({ id: uuid });

export const logHabitSchema = z.object({
  habitId: uuid,
  dateISO: z.string().regex(localDateRegex).optional(),
});

export const unlogHabitSchema = z.object({
  habitId: uuid,
  dateISO: z.string().regex(localDateRegex).optional(),
});

export const skipHabitSchema = z.object({
  habitId: uuid,
  dateISO: z.string().regex(localDateRegex),
});

export const unskipHabitSchema = z.object({
  habitId: uuid,
  dateISO: z.string().regex(localDateRegex),
});

export const weekDataSchema = z.object({
  weekStartISO: z.string().regex(localDateRegex),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  dueDateISO: z.string().regex(localDateRegex),
  parentId: uuid.optional().nullable(),
});

export const updateTaskSchema = z.object({
  id: uuid,
  title: z.string().min(1).max(500).optional(),
  dueDateISO: z.string().regex(localDateRegex).optional(),
});

export const taskIdSchema = z.object({ id: uuid });

export const listTasksSchema = z.object({
  dueDateISO: z.string().regex(localDateRegex),
});

export const foodCategorySchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "other",
]);
export type FoodCategory = z.infer<typeof foodCategorySchema>;

export const addFoodEntrySchema = z.object({
  dateISO: z.string().regex(localDateRegex),
  category: foodCategorySchema,
  description: z.string().min(1).max(2000),
});
export const deleteFoodEntrySchema = z.object({ id: uuid });
export const listFoodSchema = z.object({
  dateISO: z.string().regex(localDateRegex),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type LogHabitInput = z.infer<typeof logHabitSchema>;
export type UnlogHabitInput = z.infer<typeof unlogHabitSchema>;
export type WeekDataInput = z.infer<typeof weekDataSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;
export type AddFoodEntryInput = z.infer<typeof addFoodEntrySchema>;

export const addWeightEntrySchema = z.object({
  dateISO: z.string().regex(localDateRegex),
  weightKg: z.number().positive().max(400),
});
export const listWeightSchema = z.object({
  daysBack: z.number().int().min(1).max(365).optional(),
});
export type AddWeightEntryInput = z.infer<typeof addWeightEntrySchema>;
