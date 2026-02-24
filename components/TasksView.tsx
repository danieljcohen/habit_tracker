"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createTask,
  toggleTaskComplete,
  deleteTask,
} from "@/app/actions/tasks";
import { logHabitCompletion, unlogHabitCompletion } from "@/app/actions/habit-logs";
import type { HabitForDate } from "@/app/(main)/tasks/page";
import { addDays, format, subDays } from "date-fns";

type Task = {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
};

type TasksViewProps = {
  initialTasks: Task[];
  habitsForDate: HabitForDate[];
  selectedDateISO: string;
  todayISO: string;
};

export function TasksView({
  initialTasks,
  habitsForDate,
  selectedDateISO,
  todayISO,
}: TasksViewProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [habits, setHabits] = useState(habitsForDate);
  const [newTitle, setNewTitle] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
    setHabits(habitsForDate);
  }, [selectedDateISO, initialTasks, habitsForDate]);

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
      setTasks((prev) => [...prev, result.task!]);
    }
  }

  async function handleToggle(id: string) {
    if (pending) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    setPending(id);
    const result = await toggleTaskComplete({ id });
    setPending(null);
    if (!result.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: task.completed } : t))
      );
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (pending) return;
    const removed = tasks.find((t) => t.id === id);
    if (!removed) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setPending(id);
    const result = await deleteTask({ id });
    setPending(null);
    if (!result.success) {
      setTasks((prev) => [...prev, removed]);
      router.refresh();
    }
  }

  async function handleHabitToggle(habitId: string, currentlyDone: boolean) {
    if (pending) return;
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? {
              ...h,
              done: !currentlyDone,
              countThisWeek: h.countThisWeek + (currentlyDone ? -1 : 1),
            }
          : h
      )
    );
    setPending(habitId);
    const result = currentlyDone
      ? await unlogHabitCompletion(habitId, selectedDateISO)
      : await logHabitCompletion(habitId, selectedDateISO);
    setPending(null);
    if (!result.success) {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? {
                ...h,
                done: currentlyDone,
                countThisWeek: h.countThisWeek + (currentlyDone ? 1 : -1),
              }
            : h
        )
      );
    }
    // Always re-fetch from the server so changes persist across views.
    router.refresh();
  }

  const isToday = selectedDateISO === todayISO;
  const dateLabel = isToday
    ? "Today"
    : format(new Date(selectedDateISO + "T12:00:00"), "EEE, MMM d");

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">
        To-dos
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        Habits and one-off tasks for the day
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

      {/* Habits (check off for this day) */}
      {habits.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
            Habits
          </h2>
          <ul className="space-y-2">
            {habits.map((h) => (
              <li
                key={h.id}
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
                        h.done ? "line-through text-stone-500 dark:text-stone-400" : ""
                      }`}
                    >
                      {h.name}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {h.countThisWeek}/{h.targetPerWeek} days
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {/* Task list */}
      <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
        Tasks
      </h2>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 ${
              task.completed ? "opacity-70" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => handleToggle(task.id)}
              disabled={pending !== null}
              className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                task.completed
                  ? "bg-teal-600 border-teal-600 text-white"
                  : "border-stone-400 dark:border-stone-500 hover:border-teal-500"
              }`}
            >
              {task.completed && <span className="text-sm">✓</span>}
            </button>
            <span
              className={`flex-1 text-left text-stone-800 dark:text-stone-200 ${
                task.completed ? "line-through text-stone-500 dark:text-stone-400" : ""
              }`}
            >
              {task.title}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(task.id)}
              disabled={pending !== null}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Delete task"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
          No tasks for this day.
        </p>
      )}
    </div>
  );
}
