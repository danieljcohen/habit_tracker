"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";

const localDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const getDayOrderSchema = z.object({
  dateISO: z.string().regex(localDateRegex),
});

const updateDayOrderSchema = z.object({
  dateISO: z.string().regex(localDateRegex),
  items: z.array(
    z.object({
      itemType: z.enum(["task", "habit"]),
      itemId: z.string().uuid(),
      position: z.number().int().min(0),
    }),
  ),
});

export type DayOrderItemInput = {
  itemType: "task" | "habit";
  itemId: string;
  position: number;
};

export async function getDayOrder(input: { dateISO: string }) {
  const { dateISO } = getDayOrderSchema.parse(input);
  const order = await prisma.dayOrderItem.findMany({
    where: { dateISO },
    orderBy: { position: "asc" },
  });
  return {
    order: order.map((o) => ({
      itemType: o.itemType as "task" | "habit",
      itemId: o.itemId,
      position: o.position,
    })),
  };
}

export async function updateDayOrder(input: {
  dateISO: string;
  items: DayOrderItemInput[];
}) {
  const { dateISO, items } = updateDayOrderSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    await tx.dayOrderItem.deleteMany({ where: { dateISO } });
    if (items.length === 0) return;
    await tx.dayOrderItem.createMany({
      data: items.map((item) => ({
        dateISO,
        itemType: item.itemType,
        itemId: item.itemId,
        position: item.position,
      })),
    });
  });

  return { success: true as const };
}

