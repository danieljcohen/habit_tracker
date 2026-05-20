"use server";

import { prisma } from "@/lib/db";
import {
  createTaskSchema,
  taskIdSchema,
  listTasksSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type ListTasksInput,
  type UpdateTaskInput,
} from "@/lib/validations";

export async function createTask(input: CreateTaskInput) {
  const data = createTaskSchema.parse(input);
  if (data.parentId) {
    const parent = await prisma.task.findUnique({
      where: { id: data.parentId },
      select: { id: true, parentId: true },
    });
    if (!parent) {
      return { success: false as const, error: "Parent task not found" };
    }
    // Only allow one level of nesting.
    if (parent.parentId) {
      return {
        success: false as const,
        error: "Subtasks cannot have their own subtasks",
      };
    }
  }
  const task = await prisma.task.create({
    data: {
      title: data.title,
      dueDate: new Date(data.dueDateISO + "T12:00:00"),
      parentId: data.parentId ?? null,
    },
  });
  return { success: true as const, task };
}

export async function updateTask(input: UpdateTaskInput) {
  const data = updateTaskSchema.parse(input);
  const updateData: { title?: string; dueDate?: Date } = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.dueDateISO !== undefined) {
    updateData.dueDate = new Date(data.dueDateISO + "T12:00:00");
  }
  if (Object.keys(updateData).length === 0) {
    return { success: true as const };
  }
  await prisma.task.update({ where: { id: data.id }, data: updateData });
  return { success: true as const };
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
    include: {
      parent: { select: { id: true, title: true } },
    },
    orderBy: [{ completed: "asc" }, { createdAt: "asc" }],
  });
  return { tasks };
}

export type PlanSubtask = {
  id: string;
  title: string;
  dueDateISO: string;
  completed: boolean;
};

export type Plan = {
  id: string;
  title: string;
  dueDateISO: string;
  completed: boolean;
  subtasks: PlanSubtask[];
};

function toDateISO(d: Date): string {
  // dueDate is stored as @db.Date — extract the YYYY-MM-DD it represents.
  return d.toISOString().slice(0, 10);
}

export async function listPlans(): Promise<{ plans: Plan[] }> {
  const tasks = await prisma.task.findMany({
    where: { parentId: null },
    include: {
      subtasks: {
        orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
  });
  const plans: Plan[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    dueDateISO: toDateISO(t.dueDate),
    completed: t.completed,
    subtasks: t.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      dueDateISO: toDateISO(s.dueDate),
      completed: s.completed,
    })),
  }));
  return { plans };
}
