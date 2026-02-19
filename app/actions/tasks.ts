"use server";

import { prisma } from "@/lib/db";
import {
  createTaskSchema,
  taskIdSchema,
  listTasksSchema,
  type CreateTaskInput,
  type ListTasksInput,
} from "@/lib/validations";

export async function createTask(input: CreateTaskInput) {
  const data = createTaskSchema.parse(input);
  const task = await prisma.task.create({
    data: {
      title: data.title,
      dueDate: new Date(data.dueDateISO + "T12:00:00"),
    },
  });
  return { success: true as const, task };
}

export async function toggleTaskComplete(input: { id: string }) {
  const { id } = taskIdSchema.parse(input);
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return { success: false as const, error: "Task not found" };
  await prisma.task.update({
    where: { id },
    data: { completed: !task.completed },
  });
  return { success: true as const };
}

export async function deleteTask(input: { id: string }) {
  const { id } = taskIdSchema.parse(input);
  await prisma.task.delete({ where: { id } });
  return { success: true as const };
}

export async function listTasks(input: ListTasksInput) {
  const { dueDateISO } = listTasksSchema.parse(input);
  const dayStart = new Date(dueDateISO + "T00:00:00");
  const dayEndExclusive = new Date(dueDateISO + "T00:00:00");
  dayEndExclusive.setUTCDate(dayEndExclusive.getUTCDate() + 1);
  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { gte: dayStart, lt: dayEndExclusive },
    },
    orderBy: [{ completed: "asc" }, { createdAt: "asc" }],
  });
  return { tasks };
}
