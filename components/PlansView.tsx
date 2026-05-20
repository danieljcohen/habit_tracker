"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  createTask,
  toggleTaskComplete,
  deleteTask,
  updateTask,
  type Plan,
  type PlanSubtask,
} from "@/app/actions/tasks";

type PlansViewProps = {
  initialPlans: Plan[];
  todayISO: string;
};

type EditingState =
  | null
  | { kind: "plan"; id: string; title: string; dueDateISO: string }
  | { kind: "subtask"; id: string; title: string; dueDateISO: string };

export function PlansView({ initialPlans, todayISO }: PlansViewProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState(defaultFutureISO(todayISO));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [subInput, setSubInput] = useState<
    Record<string, { title: string; dueDateISO: string }>
  >({});
  const [pending, setPending] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  const visiblePlans = useMemo(
    () => (showCompleted ? plans : plans.filter((p) => !p.completed)),
    [plans, showCompleted],
  );

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function getSubInput(planId: string) {
    return (
      subInput[planId] ?? { title: "", dueDateISO: defaultFutureISO(todayISO) }
    );
  }

  function setSubInputFor(planId: string, partial: Partial<{ title: string; dueDateISO: string }>) {
    setSubInput((prev) => ({
      ...prev,
      [planId]: { ...getSubInput(planId), ...partial },
    }));
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || pending) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDueDate)) return;
    setPending("create-plan");
    const result = await createTask({
      title,
      dueDateISO: newDueDate,
      parentId: null,
    });
    setPending(null);
    if (result.success && result.task) {
      setNewTitle("");
      setNewDueDate(defaultFutureISO(todayISO));
      router.refresh();
    }
  }

  async function handleAddSubtask(e: React.FormEvent, planId: string) {
    e.preventDefault();
    const { title, dueDateISO } = getSubInput(planId);
    const trimmed = title.trim();
    if (!trimmed || pending) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateISO)) return;
    setPending(`add-sub-${planId}`);
    const result = await createTask({
      title: trimmed,
      dueDateISO,
      parentId: planId,
    });
    setPending(null);
    if (result.success) {
      setSubInputFor(planId, {
        title: "",
        dueDateISO: defaultFutureISO(todayISO),
      });
      setExpanded((prev) => ({ ...prev, [planId]: true }));
      router.refresh();
    }
  }

  async function handleToggle(id: string, currentlyCompleted: boolean) {
    if (pending) return;
    setPlans((prev) => optimisticToggle(prev, id, !currentlyCompleted));
    setPending(`toggle-${id}`);
    const result = await toggleTaskComplete({ id });
    setPending(null);
    if (!result.success) {
      setPlans((prev) => optimisticToggle(prev, id, currentlyCompleted));
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (pending) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm("Delete this item? Subtasks will also be deleted.");
      if (!ok) return;
    }
    setPending(`delete-${id}`);
    const result = await deleteTask({ id });
    setPending(null);
    if (result.success) {
      setPlans((prev) => removeById(prev, id));
    }
    router.refresh();
  }

  function startEditPlan(plan: Plan) {
    setEditing({
      kind: "plan",
      id: plan.id,
      title: plan.title,
      dueDateISO: plan.dueDateISO,
    });
  }

  function startEditSubtask(sub: PlanSubtask) {
    setEditing({
      kind: "subtask",
      id: sub.id,
      title: sub.title,
      dueDateISO: sub.dueDateISO,
    });
  }

  async function saveEdit() {
    if (!editing || pending) return;
    const title = editing.title.trim();
    if (!title) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editing.dueDateISO)) return;
    setPending(`edit-${editing.id}`);
    const result = await updateTask({
      id: editing.id,
      title,
      dueDateISO: editing.dueDateISO,
    });
    setPending(null);
    if (result.success) {
      setEditing(null);
      router.refresh();
    }
  }

  return (
    <div className="p-4 pb-28 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">
        Plans
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        Long-term tasks and their subtasks
      </p>

      <form
        onSubmit={handleCreatePlan}
        className="mb-6 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
      >
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
          New plan
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What do you want to accomplish?"
            className="flex-1 px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            disabled={pending !== null}
          />
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm [color-scheme:light]"
            disabled={pending !== null}
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || pending !== null}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            Add plan
          </button>
        </div>
      </form>

      <label className="flex items-center gap-2 mb-3 text-sm text-stone-600 dark:text-stone-400">
        <input
          type="checkbox"
          checked={showCompleted}
          onChange={(e) => setShowCompleted(e.target.checked)}
          className="rounded border-stone-300"
        />
        Show completed
      </label>

      {visiblePlans.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
          No plans yet. Add one above.
        </p>
      ) : (
        <ul className="space-y-3">
          {visiblePlans.map((plan) => {
            const subtasksVisible = showCompleted
              ? plan.subtasks
              : plan.subtasks.filter((s) => !s.completed);
            const isExpanded = expanded[plan.id] ?? plan.subtasks.length > 0;
            const totalSubs = plan.subtasks.length;
            const doneSubs = plan.subtasks.filter((s) => s.completed).length;
            const isEditingPlan =
              editing?.kind === "plan" && editing.id === plan.id;
            return (
              <li
                key={plan.id}
                className={`rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 overflow-hidden ${
                  plan.completed ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-start gap-3 p-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(plan.id, plan.completed)}
                    disabled={pending !== null}
                    className={`shrink-0 mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                      plan.completed
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-stone-400 dark:border-stone-500 hover:border-teal-500"
                    }`}
                    aria-label={plan.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {plan.completed && <span className="text-sm">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    {isEditingPlan ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={editing.title}
                          onChange={(e) =>
                            setEditing({ ...editing, title: e.target.value })
                          }
                          className="px-2 py-1.5 rounded border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={editing.dueDateISO}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                dueDateISO: e.target.value,
                              })
                            }
                            className="px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm [color-scheme:light]"
                          />
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={pending !== null}
                            className="px-2 py-1 rounded bg-teal-600 text-white text-sm"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="px-2 py-1 rounded border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleExpanded(plan.id)}
                          className="w-full text-left"
                        >
                          <div
                            className={`font-medium text-stone-900 dark:text-stone-100 ${
                              plan.completed
                                ? "line-through text-stone-500 dark:text-stone-400"
                                : ""
                            }`}
                          >
                            {plan.title}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                            <span>{formatDueLabel(plan.dueDateISO, todayISO)}</span>
                            {totalSubs > 0 && (
                              <span>
                                · {doneSubs}/{totalSubs} subtasks
                              </span>
                            )}
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                  {!isEditingPlan && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditPlan(plan)}
                        disabled={pending !== null}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
                        aria-label="Edit plan"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(plan.id)}
                        disabled={pending !== null}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        aria-label="Delete plan"
                      >
                        ✕
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(plan.id)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? "▾" : "▸"}
                      </button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/40 px-3 py-3">
                    {subtasksVisible.length > 0 && (
                      <ul className="space-y-1.5 mb-2">
                        {subtasksVisible.map((sub) => {
                          const isEditingSub =
                            editing?.kind === "subtask" &&
                            editing.id === sub.id;
                          return (
                            <li
                              key={sub.id}
                              className={`flex items-start gap-2 py-1.5 px-2 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 ${
                                sub.completed ? "opacity-70" : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggle(sub.id, sub.completed)}
                                disabled={pending !== null}
                                className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  sub.completed
                                    ? "bg-teal-600 border-teal-600 text-white"
                                    : "border-stone-400 dark:border-stone-500 hover:border-teal-500"
                                }`}
                                aria-label={
                                  sub.completed
                                    ? "Mark incomplete"
                                    : "Mark complete"
                                }
                              >
                                {sub.completed && <span className="text-xs">✓</span>}
                              </button>
                              <div className="flex-1 min-w-0">
                                {isEditingSub ? (
                                  <div className="flex flex-col gap-2">
                                    <input
                                      type="text"
                                      value={editing.title}
                                      onChange={(e) =>
                                        setEditing({
                                          ...editing,
                                          title: e.target.value,
                                        })
                                      }
                                      className="px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
                                      autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="date"
                                        value={editing.dueDateISO}
                                        onChange={(e) =>
                                          setEditing({
                                            ...editing,
                                            dueDateISO: e.target.value,
                                          })
                                        }
                                        className="px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm [color-scheme:light]"
                                      />
                                      <button
                                        type="button"
                                        onClick={saveEdit}
                                        disabled={pending !== null}
                                        className="px-2 py-1 rounded bg-teal-600 text-white text-sm"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditing(null)}
                                        className="px-2 py-1 rounded border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div
                                      className={`text-sm text-stone-800 dark:text-stone-200 ${
                                        sub.completed
                                          ? "line-through text-stone-500 dark:text-stone-400"
                                          : ""
                                      }`}
                                    >
                                      {sub.title}
                                    </div>
                                    <div className="text-xs text-stone-500 dark:text-stone-400">
                                      {formatDueLabel(sub.dueDateISO, todayISO)}
                                    </div>
                                  </>
                                )}
                              </div>
                              {!isEditingSub && (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => startEditSubtask(sub)}
                                    disabled={pending !== null}
                                    className="w-7 h-7 inline-flex items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
                                    aria-label="Edit subtask"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(sub.id)}
                                    disabled={pending !== null}
                                    className="w-7 h-7 inline-flex items-center justify-center rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    aria-label="Delete subtask"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <form
                      onSubmit={(e) => handleAddSubtask(e, plan.id)}
                      className="flex flex-col gap-2 sm:flex-row"
                    >
                      <input
                        type="text"
                        value={getSubInput(plan.id).title}
                        onChange={(e) =>
                          setSubInputFor(plan.id, { title: e.target.value })
                        }
                        placeholder="Add subtask…"
                        className="flex-1 px-2.5 py-1.5 rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        disabled={pending !== null}
                      />
                      <input
                        type="date"
                        value={getSubInput(plan.id).dueDateISO}
                        onChange={(e) =>
                          setSubInputFor(plan.id, { dueDateISO: e.target.value })
                        }
                        className="px-2.5 py-1.5 rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm [color-scheme:light]"
                        disabled={pending !== null}
                      />
                      <button
                        type="submit"
                        disabled={
                          !getSubInput(plan.id).title.trim() ||
                          pending !== null
                        }
                        className="px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function defaultFutureISO(todayISO: string): string {
  const d = new Date(todayISO + "T12:00:00");
  d.setDate(d.getDate() + 7);
  return format(d, "yyyy-MM-dd");
}

function formatDueLabel(dueISO: string, todayISO: string): string {
  const due = new Date(dueISO + "T12:00:00");
  const today = new Date(todayISO + "T12:00:00");
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((due.getTime() - today.getTime()) / msPerDay);
  const dateLabel = format(due, "EEE, MMM d");
  if (diffDays === 0) return `Due today · ${dateLabel}`;
  if (diffDays === 1) return `Due tomorrow · ${dateLabel}`;
  if (diffDays === -1) return `1 day overdue · ${dateLabel}`;
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue · ${dateLabel}`;
  if (diffDays < 7) return `In ${diffDays} days · ${dateLabel}`;
  return `Due ${dateLabel}`;
}

function optimisticToggle(
  plans: Plan[],
  id: string,
  completed: boolean,
): Plan[] {
  return plans.map((p) => {
    if (p.id === id) return { ...p, completed };
    if (p.subtasks.some((s) => s.id === id)) {
      return {
        ...p,
        subtasks: p.subtasks.map((s) =>
          s.id === id ? { ...s, completed } : s,
        ),
      };
    }
    return p;
  });
}

function removeById(plans: Plan[], id: string): Plan[] {
  return plans
    .filter((p) => p.id !== id)
    .map((p) => ({
      ...p,
      subtasks: p.subtasks.filter((s) => s.id !== id),
    }));
}
