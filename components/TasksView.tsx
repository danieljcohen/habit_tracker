"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, subDays } from "date-fns";
import {
  createTask,
  toggleTaskComplete,
  deleteTask,
} from "@/app/actions/tasks";
import {
  logHabitCompletion,
  unlogHabitCompletion,
} from "@/app/actions/habit-logs";
import { skipHabit } from "@/app/actions/habit-skips";
import { updateDayOrder } from "@/app/actions/day-order";
import { scoreDietForDay } from "@/app/actions/habit-coach";
import {
  addFoodEntry,
  deleteFoodEntry,
  submitFoodForDay,
  type FoodEntry,
} from "@/app/actions/food-logs";
import type { FoodCategory } from "@/lib/validations";
import type { DayItem } from "@/app/(main)/tasks/page";

const FOOD_CATEGORIES: { key: FoodCategory; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "other", label: "Other" },
];

const FOOD_HABIT_NAME = "Log food";

type TasksViewProps = {
  initialItems: DayItem[];
  initialFood: FoodEntry[];
  selectedDateISO: string;
  todayISO: string;
};

export function TasksView({
  initialItems,
  initialFood,
  selectedDateISO,
  todayISO,
}: TasksViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<DayItem[]>(initialItems);
  const [food, setFood] = useState<FoodEntry[]>(initialFood);
  const [newTitle, setNewTitle] = useState("");
  const [newFoodByCategory, setNewFoodByCategory] = useState<
    Partial<Record<FoodCategory, string>>
  >({});
  const [pending, setPending] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems, selectedDateISO]);

  useEffect(() => {
    setFood(initialFood);
  }, [initialFood, selectedDateISO]);

  function keyFor(item: DayItem) {
    return `${item.kind}:${item.id}`;
  }

  async function persistOrder(nextItems: DayItem[]) {
    setItems(nextItems);
    await updateDayOrder({
      dateISO: selectedDateISO,
      items: nextItems.map((item, index) => ({
        itemType: item.kind,
        itemId: item.id,
        position: index,
      })),
    });
  }

  function prevDay() {
    const d = subDays(new Date(selectedDateISO + "T12:00:00"), 1);
    router.push("/tasks?date=" + format(d, "yyyy-MM-dd"));
  }

  function nextDay() {
    const d = addDays(new Date(selectedDateISO + "T12:00:00"), 1);
    router.push("/tasks?date=" + format(d, "yyyy-MM-dd"));
  }

  function goToToday() {
    router.push("/tasks?date=" + todayISO);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) router.push("/tasks?date=" + v);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || pending) return;
    setPending("create");
    const result = await createTask({
      title,
      dueDateISO: selectedDateISO,
    });
    setPending(null);
    if (result.success && result.task) {
      setNewTitle("");
      const newItem: DayItem = {
        kind: "task",
        id: result.task.id,
        title: result.task.title,
        completed: result.task.completed,
      };
      const next = [...items, newItem];
      await persistOrder(next);
    }
  }

  async function handleToggleTask(id: string) {
    if (pending) return;
    const task = items.find((i) => i.kind === "task" && i.id === id);
    if (!task || task.kind !== "task") return;
    const optimistic = items.map((i) =>
      i.kind === "task" && i.id === id ? { ...i, completed: !i.completed } : i,
    );
    setItems(optimistic);
    setPending(id);
    const result = await toggleTaskComplete({ id });
    setPending(null);
    if (!result.success) {
      setItems((prev) =>
        prev.map((i) =>
          i.kind === "task" && i.id === id
            ? { ...i, completed: task.completed }
            : i,
        ),
      );
      router.refresh();
    }
  }

  async function handleDeleteTask(id: string) {
    if (pending) return;
    const removed = items.find((i) => i.kind === "task" && i.id === id);
    if (!removed) return;
    const next = items.filter((i) => !(i.kind === "task" && i.id === id));
    setItems(next);
    setPending(id);
    const result = await deleteTask({ id });
    setPending(null);
    if (!result.success) {
      setItems((prev) => [...prev, removed]);
      router.refresh();
    } else {
      await persistOrder(next);
    }
  }

  async function handleHabitToggle(habitId: string, currentlyDone: boolean) {
    if (pending) return;
    const habit = items.find(
      (item) => item.kind === "habit" && item.id === habitId,
    );
    if (habit && habit.kind === "habit" && habit.name === FOOD_HABIT_NAME) {
      // This habit can only be checked by submitting food for the day.
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.kind === "habit" && item.id === habitId
          ? {
              ...item,
              done: !currentlyDone,
              countThisWeek:
                item.countThisWeek + (currentlyDone ? -1 : 1),
            }
          : item,
      ),
    );
    setPending(habitId);
    const result = currentlyDone
      ? await unlogHabitCompletion(habitId, selectedDateISO)
      : await logHabitCompletion(habitId, selectedDateISO);
    setPending(null);
    if (!result.success) {
      setItems((prev) =>
        prev.map((item) =>
          item.kind === "habit" && item.id === habitId
            ? {
                ...item,
                done: currentlyDone,
                countThisWeek:
                  item.countThisWeek + (currentlyDone ? 1 : -1),
              }
            : item,
        ),
      );
    }
    // Ensure other views (like Week) see the updated state.
    router.refresh();
  }

  async function handleSkipToday(habitId: string) {
    if (pending) return;
    setItems((prev) =>
      prev.map((item) =>
        item.kind === "habit" && item.id === habitId
          ? { ...item, skipped: true }
          : item,
      ),
    );
    setPending(`skip-${habitId}`);
    const result = await skipHabit(habitId, selectedDateISO);
    setPending(null);
    if (!result.success) {
      setItems((prev) =>
        prev.map((item) =>
          item.kind === "habit" && item.id === habitId
            ? { ...item, skipped: false }
            : item,
        ),
      );
    }
    router.refresh();
  }

  function handleDragStart(
    e: React.DragEvent<HTMLLIElement>,
    item: DayItem,
  ) {
    setDragKey(keyFor(item));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(
    e: React.DragEvent<HTMLLIElement>,
    overKey: string,
  ) {
    e.preventDefault();
    if (!dragKey || dragKey === overKey) return;
    const fromIndex = items.findIndex((i) => keyFor(i) === dragKey);
    const toIndex = items.findIndex((i) => keyFor(i) === overKey);
    if (fromIndex === -1 || toIndex === -1) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setItems(updated);
  }

  async function handleDragEnd() {
    if (dragKey === null) return;
    setDragKey(null);
    await persistOrder(items);
  }

  async function handleAddFood(e: React.FormEvent, category: FoodCategory) {
    e.preventDefault();
    const description = (newFoodByCategory[category] ?? "").trim();
    if (!description || pending) return;
    setPending(`food-${category}`);
    const result = await addFoodEntry({
      dateISO: selectedDateISO,
      category,
      description,
    });
    setPending(null);
    if (result.success && result.entry) {
      setFood((prev) => [...prev, result.entry!]);
      setNewFoodByCategory((prev) => ({ ...prev, [category]: "" }));
    }
  }

  async function handleDeleteFood(id: string) {
    if (pending) return;
    setFood((prev) => prev.filter((e) => e.id !== id));
    setPending(id);
    const result = await deleteFoodEntry({ id });
    setPending(null);
    if (!result.success) router.refresh();
  }

  async function handleSubmitFoodForDay() {
    if (pending) return;
    if (food.length === 0) return;

    // Require confirmation if any main meal category is empty.
    const categoriesPresent = new Set<FoodCategory>(
      food.map((e) => e.category),
    );
    const mainMeals: FoodCategory[] = ["breakfast", "lunch", "dinner"];
    const missing = mainMeals.filter((c) => !categoriesPresent.has(c));
    if (missing.length > 0) {
      const missingLabels = FOOD_CATEGORIES.filter(({ key }) =>
        missing.includes(key),
      )
        .map(({ label }) => label)
        .join(", ");
      const message = `You haven't logged anything for ${missingLabels}. Submit anyway?`;
      if (typeof window !== "undefined") {
        const ok = window.confirm(message);
        if (!ok) return;
      }
    }

    setPending("submit-food");
    const result = await submitFoodForDay({ dateISO: selectedDateISO });
    setPending(null);
    if (!result?.success) {
      router.refresh();
      return;
    }
    // Asynchronously score the day's diet; errors are non-fatal.
    try {
      await scoreDietForDay({ dateISO: selectedDateISO });
    } catch (err) {
      console.error("Failed to score diet for day", err);
    }
    // Optimistically mark the \"Log food\" habit as done for today.
    setItems((prev) =>
      prev.map((item) =>
        item.kind === "habit" &&
        item.name === FOOD_HABIT_NAME &&
        !item.done
          ? {
              ...item,
              done: true,
              countThisWeek: item.countThisWeek + 1,
            }
          : item,
      ),
    );
    router.refresh();
  }

  const isToday = selectedDateISO === todayISO;
  const dateLabel = isToday
    ? "Today"
    : format(new Date(selectedDateISO + "T12:00:00"), "EEE, MMM d");

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">
        Today
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        Habits, tasks, and food for the day
      </p>

      {/* Date navigation */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={prevDay}
          className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          ←
        </button>
        <div className="flex flex-col items-center">
          <input
            type="date"
            value={selectedDateISO}
            onChange={handleDateChange}
            className="text-base font-medium text-stone-900 dark:text-stone-100 bg-transparent border-none focus:outline-none focus:ring-0 [color-scheme:light]"
          />
          <button
            type="button"
            onClick={goToToday}
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline mt-0.5"
          >
            {isToday ? "Today" : "Go to today"}
          </button>
        </div>
        <button
          type="button"
          onClick={nextDay}
          className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          →
        </button>
      </div>

      {/* Add task */}
      <form onSubmit={handleAddTask} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add task…"
            className="flex-1 px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            disabled={pending !== null}
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || pending !== null}
            className="px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium"
          >
            Add
          </button>
        </div>
      </form>

      {/* Combined habits + tasks list with drag-to-reorder */}
      <ul className="space-y-2">
        {items.map((item) => {
          if (item.kind === "habit") {
            const h = item;
            return (
              <li
                key={keyFor(item)}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, keyFor(item))}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 ${
                  h.skipped ? "opacity-70" : ""
                }`}
              >
                {h.skipped ? (
                  <>
                    <span className="shrink-0 w-6 h-6 rounded-md border-2 border-amber-400 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs">
                      —
                    </span>
                    <span className="flex-1 text-stone-500 dark:text-stone-400">
                      {h.name}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      Skipped
                    </span>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleHabitToggle(h.id, h.done)}
                      disabled={pending !== null}
                      className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                        h.done
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "border-stone-400 dark:border-stone-500 hover:border-teal-500"
                      }`}
                    >
                      {h.done && <span className="text-sm">✓</span>}
                    </button>
                    <span
                      className={`flex-1 text-left text-stone-800 dark:text-stone-200 ${
                        h.done
                          ? "line-through text-stone-500 dark:text-stone-400"
                          : ""
                      }`}
                    >
                      {h.name}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {h.countThisWeek}/{h.targetPerWeek} days
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSkipToday(h.id)}
                      disabled={pending !== null}
                      className="ml-2 w-7 h-7 inline-flex items-center justify-center rounded-lg text-stone-300 hover:text-stone-500 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-200 dark:hover:bg-stone-700 text-base"
                      aria-label="Skip for today"
                    >
                      ✕
                    </button>
                  </>
                )}
              </li>
            );
          }

          const t = item;
          return (
            <li
              key={keyFor(item)}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={(e) => handleDragOver(e, keyFor(item))}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 ${
                t.completed ? "opacity-70" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleTask(t.id)}
                disabled={pending !== null}
                className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                  t.completed
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "border-stone-400 dark:border-stone-500 hover:border-teal-500"
                }`}
              >
                {t.completed && <span className="text-sm">✓</span>}
              </button>
              <span
                className={`flex-1 text-left text-stone-800 dark:text-stone-200 ${
                  t.completed
                    ? "line-through text-stone-500 dark:text-stone-400"
                    : ""
                }`}
              >
                {t.title}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteTask(t.id)}
                disabled={pending !== null}
                className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-base"
                aria-label="Delete task"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
      {items.length === 0 && (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
          No habits or tasks for this day.
        </p>
      )}

      {/* Food log */}
      <section className="mt-5 pt-4 mb-24 border-t border-stone-200 dark:border-stone-700">
        <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
          Food
        </h2>
        <div className="space-y-2">
          {FOOD_CATEGORIES.map(({ key: category, label }) => {
            const entries = food.filter((e) => e.category === category);
            return (
              <div
                key={category}
                className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2"
              >
                <h3 className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wide">
                  {label}
                </h3>
                <form
                  onSubmit={(e) => handleAddFood(e, category)}
                  className="flex gap-1.5 mb-1.5"
                >
                  <input
                    type="text"
                    value={newFoodByCategory[category] ?? ""}
                    onChange={(e) =>
                      setNewFoodByCategory((prev) => ({
                        ...prev,
                        [category]: e.target.value,
                      }))
                    }
                    placeholder={`Add to ${label.toLowerCase()}…`}
                    className="flex-1 px-2.5 py-1.5 rounded-md border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    disabled={pending !== null}
                  />
                  <button
                    type="submit"
                    disabled={
                      !(newFoodByCategory[category] ?? "").trim() ||
                      pending !== null
                    }
                    className="px-2.5 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium"
                  >
                    Add
                  </button>
                </form>
                {entries.length > 0 ? (
                  <ul className="space-y-1">
                    {entries.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center gap-2 py-1 px-1.5 rounded-md bg-stone-50 dark:bg-stone-900/50 text-sm text-stone-800 dark:text-stone-200"
                      >
                        <span className="flex-1">{entry.description}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFood(entry.id)}
                          disabled={pending !== null}
                          className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-base"
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleSubmitFoodForDay}
          disabled={food.length === 0 || pending !== null}
          className="mt-3 w-full py-2 rounded-lg border border-teal-600 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-sm font-medium disabled:opacity-50"
        >
          Submit food for today
        </button>
      </section>
    </div>
  );
}

