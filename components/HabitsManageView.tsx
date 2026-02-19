"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createHabit,
  updateHabit,
  toggleArchiveHabit,
} from "@/app/actions/habits";

type Habit = {
  id: string;
  name: string;
  targetPerDay: number;
  archived: boolean;
  createdAt: Date;
};

type HabitsManageViewProps = { initialHabits: Habit[] };

export function HabitsManageView({ initialHabits }: HabitsManageViewProps) {
  const router = useRouter();
  const [habits, setHabits] = useState(initialHabits);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState(1);
  const [pending, setPending] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || pending) return;
    if (newTarget < 1) return;
    setPending("create");
    const result = await createHabit({ name, targetPerDay: newTarget });
    setPending(null);
    if (result.success && result.habit) {
      setNewName("");
      setNewTarget(1);
      router.refresh();
      setHabits((prev) => [...prev, result.habit!]);
    }
  }

  function startEdit(h: Habit) {
    setEditingId(h.id);
    setEditName(h.name);
    setEditTarget(h.targetPerDay);
  }

  async function saveEdit() {
    if (!editingId || pending) return;
    setPending(editingId);
    await updateHabit({
      id: editingId,
      name: editName.trim(),
      targetPerDay: editTarget,
    });
    setPending(null);
    setEditingId(null);
    router.refresh();
    setHabits((prev) =>
      prev.map((x) =>
        x.id === editingId
          ? { ...x, name: editName.trim(), targetPerDay: editTarget }
          : x
      )
    );
  }

  async function handleArchive(id: string) {
    if (pending) return;
    setPending(id);
    await toggleArchiveHabit({ id });
    setPending(null);
    router.refresh();
    setHabits((prev) =>
      prev.map((x) => (x.id === id ? { ...x, archived: !x.archived } : x))
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
        Habits
      </h1>

      {/* Add habit */}
      <form onSubmit={handleCreate} className="mb-6 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Habit name"
          className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
          disabled={pending !== null}
        />
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm text-stone-600 dark:text-stone-400">
            Target per day:
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={newTarget}
            onChange={(e) => setNewTarget(parseInt(e.target.value, 10) || 1)}
            className="w-16 px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            disabled={pending !== null}
          />
        </div>
        <button
          type="submit"
          disabled={!newName.trim() || pending !== null}
          className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium"
        >
          Add habit
        </button>
      </form>

      {/* List */}
      <ul className="space-y-2">
        {habits.map((h) => (
          <li
            key={h.id}
            className={`p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 ${
              h.archived ? "opacity-60" : ""
            }`}
          >
            {editingId === h.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm text-stone-500">Target:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editTarget}
                    onChange={(e) =>
                      setEditTarget(parseInt(e.target.value, 10) || 1)
                    }
                    className="w-14 px-2 py-1 rounded border border-stone-300 dark:border-stone-600"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={pending !== null}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">
                    {h.name}
                  </p>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {h.targetPerDay} per day
                    {h.archived && " · Archived"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(h)}
                    disabled={pending !== null}
                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
                    aria-label="Edit"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(h.id)}
                    disabled={pending !== null}
                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
                    aria-label={h.archived ? "Unarchive" : "Archive"}
                  >
                    {h.archived ? "↩" : "📦"}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {habits.length === 0 && (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
          No habits yet. Add one above.
        </p>
      )}
    </div>
  );
}
