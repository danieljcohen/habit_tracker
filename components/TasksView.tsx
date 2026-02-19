"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTask,
  toggleTaskComplete,
  deleteTask,
} from "@/app/actions/tasks";
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
  selectedDateISO: string;
  todayISO: string;
};

export function TasksView({
  initialTasks,
  selectedDateISO,
  todayISO,
}: TasksViewProps) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const tasks = initialTasks;

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
    if (result.success) {
      setNewTitle("");
      router.refresh();
    }
  }

  async function handleToggle(id: string) {
    if (pending) return;
    setPending(id);
    await toggleTaskComplete({ id });
    setPending(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (pending) return;
    setPending(id);
    await deleteTask({ id });
    setPending(null);
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
        One-off items for the day (separate from habits)
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

      {/* Task list */}
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
