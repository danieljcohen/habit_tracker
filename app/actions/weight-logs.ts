"use server";

import { prisma } from "@/lib/db";
import {
  addWeightEntrySchema,
  listWeightSchema,
  type AddWeightEntryInput,
} from "@/lib/validations";

export type WeightEntry = {
  id: string;
  dateISO: string;
  weightKg: number;
  createdAt: Date;
};

export async function addWeightEntry(input: AddWeightEntryInput) {
  const data = addWeightEntrySchema.parse(input);
  const entry = await prisma.weightLog.create({
    data: {
      dateISO: data.dateISO,
      weightKg: data.weightKg,
    },
  });
  return {
    success: true as const,
    entry: {
      id: entry.id,
      dateISO: entry.dateISO,
      weightKg: entry.weightKg,
      createdAt: entry.createdAt,
    } satisfies WeightEntry,
  };
}

export async function listWeightEntries(input?: { daysBack?: number }) {
  const data = listWeightSchema.parse(input ?? {});
  const where: { dateISO?: { gte: string } } = {};
  if (data.daysBack) {
    const today = new Date();
    const start = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    start.setUTCDate(start.getUTCDate() - data.daysBack + 1);
    const yyyy = start.getUTCFullYear();
    const mm = String(start.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(start.getUTCDate()).padStart(2, "0");
    where.dateISO = { gte: `${yyyy}-${mm}-${dd}` };
  }

  const entries = await prisma.weightLog.findMany({
    where,
    orderBy: { dateISO: "asc" },
  });

  return {
    entries: entries.map((e) => ({
      id: e.id,
      dateISO: e.dateISO,
      weightKg: e.weightKg,
      createdAt: e.createdAt,
    })) satisfies WeightEntry[],
  };
}

