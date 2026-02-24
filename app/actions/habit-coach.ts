"use server";

import { prisma } from "@/lib/db";
import { subDays, format } from "date-fns";

const COACH_MODEL = "grok-4"; // Model ID per xAI docs

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

async function buildHabitContext(): Promise<string> {
  const today = new Date();
  const start = subDays(today, 13); // last 14 days including today
  const startISO = format(start, "yyyy-MM-dd");
  const endISO = format(today, "yyyy-MM-dd");

  const [habits, logs, foodLogs, weightLogs, tasks] = await Promise.all([
    prisma.habit.findMany({
      where: { archived: false },
      select: { id: true, name: true, targetPerWeek: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.habitLog.findMany({
      where: {
        occurredAt: {
          gte: new Date(startISO + "T00:00:00Z"),
          lte: new Date(endISO + "T23:59:59Z"),
        },
      },
      select: { habitId: true, occurredAt: true },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.foodLog.findMany({
      where: { dateISO: { gte: startISO, lte: endISO } },
      orderBy: [{ dateISO: "asc" }, { createdAt: "asc" }],
    }),
    prisma.weightLog.findMany({
      where: { dateISO: { gte: startISO, lte: endISO } },
      orderBy: { dateISO: "asc" },
    }),
    prisma.task.findMany({
      where: {
        dueDate: {
          gte: new Date(startISO + "T00:00:00Z"),
          lte: new Date(endISO + "T23:59:59Z"),
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const habitById = new Map(habits.map((h) => [h.id, h]));
  const completionsByHabit: Record<
    string,
    { dateISO: string; count: number }[]
  > = {};
  for (const log of logs) {
    const habit = habitById.get(log.habitId);
    if (!habit) continue;
    const dateISO = format(log.occurredAt, "yyyy-MM-dd");
    if (!completionsByHabit[habit.id]) {
      completionsByHabit[habit.id] = [];
    }
    const arr = completionsByHabit[habit.id];
    const existing = arr.find((x) => x.dateISO === dateISO);
    if (existing) existing.count += 1;
    else arr.push({ dateISO, count: 1 });
  }

  const lines: string[] = [];
  lines.push(`Date range: ${startISO} to ${endISO}`);
  lines.push("");
  lines.push("Habits (with completions):");
  for (const h of habits) {
    lines.push(
      `- ${h.name} (target ${h.targetPerWeek} days/week): ${
        (completionsByHabit[h.id]?.length ?? 0
        ).toString()
      } days completed in this window`,
    );
  }
  lines.push("");
  lines.push("Recent food logs (date, category, description):");
  for (const f of foodLogs.slice(-50)) {
    lines.push(`- ${f.dateISO} [${f.category}]: ${f.description}`);
  }
  lines.push("");
  lines.push("Recent weight logs (date, kg):");
  for (const w of weightLogs) {
    lines.push(`- ${w.dateISO}: ${w.weightKg.toFixed(2)} kg`);
  }
  lines.push("");
  lines.push("Recent tasks (date, title, completed?):");
  for (const t of tasks.slice(-50)) {
    const d = format(t.dueDate, "yyyy-MM-dd");
    lines.push(`- ${d}: ${t.title} [${t.completed ? "done" : "open"}]`);
  }

  return lines.join("\n");
}

export async function askHabitCoach(input: { question: string }) {
  const apiKey = requireEnv("XAI_API_KEY");
  const context = await buildHabitContext();

  const systemPrompt =
    "You are a friendly habit and health coach. " +
    "You look at the user's recent habits, food, weight, and tasks, " +
    "and give concrete, encouraging feedback and suggestions. " +
    "Be concise but specific. Never mention raw JSON or database terms.";

  const userPrompt =
    `Here is my recent data:\n\n${context}\n\n` +
    `User question: ${input.question}`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: COACH_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    console.error("Habit coach API error", await res.text());
    throw new Error("Habit coach request failed");
  }

  const data = await res.json();
  const content =
    data?.choices?.[0]?.message?.content ??
    "Sorry, I couldn't generate a response right now.";

  return { answer: content as string };
}

export async function scoreDietForDay(input: { dateISO: string }) {
  const apiKey = requireEnv("XAI_API_KEY");
  const { dateISO } = input;

  const foodLogs = await prisma.foodLog.findMany({
    where: { dateISO },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  if (foodLogs.length === 0) {
    return { success: false as const, error: "No food logs for this day" };
  }

  const systemPrompt =
    "You are a nutrition coach helping the user eat healthily in a caloric deficit. " +
    "Given the foods they ate on one specific day, rate how well that day supports " +
    "their goal (healthy caloric deficit) on a scale from 1 to 5, where 5 is excellent " +
    "and 1 is very poor. Respond ONLY with a short JSON object like " +
    '{"score": 4, "reason": "short explanation"} and nothing else.';

  const foodText = foodLogs
    .map((f) => `- [${f.category}] ${f.description}`)
    .join("\n");

  const userPrompt =
    `Date: ${dateISO}\n\nFoods:\n${foodText}\n\n` +
    "Remember: respond with JSON {\"score\": number 1-5, \"reason\": \"...\"}.";

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: COACH_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      temperature: 0.3,
    }),
  });

  let score = 3;
  let note: string | null = null;

  if (res.ok) {
    try {
      const data = await res.json();
      const content: string =
        data?.choices?.[0]?.message?.content ?? '{"score":3}';
      const parsed = JSON.parse(content);
      const s = Number(parsed.score);
      if (Number.isFinite(s)) {
        score = Math.min(5, Math.max(1, Math.round(s)));
      }
      if (parsed.reason && typeof parsed.reason === "string") {
        note = parsed.reason;
      }
    } catch {
      // If parsing fails, keep default score.
    }
  } else {
    console.error("Diet score API error", await res.text());
  }

  await prisma.dietScore.upsert({
    where: { dateISO },
    update: { score, note },
    create: { dateISO, score, note },
  });

  return { success: true as const, score, note };
}

