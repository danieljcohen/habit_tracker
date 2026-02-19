"use client";

import { formatShortDay } from "@/lib/date-utils";

type DayModalProps = {
  habitName: string;
  date: string;
  count: number;
  target: number;
  skipped: boolean;
  onLog: () => void;
  onUnlog: () => void;
  onSkip: () => void;
  onUnskip: () => void;
  onClose: () => void;
  pending: boolean;
};

export function DayModal({
  habitName,
  date,
  count,
  target,
  skipped,
  onLog,
  onUnlog,
  onSkip,
  onUnskip,
  onClose,
  pending,
}: DayModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-modal-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-stone-800 shadow-xl border border-stone-200 dark:border-stone-700 p-6 mx-4"
      >
        <h2 id="day-modal-title" className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          {habitName}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          {formatShortDay(date)} — {date}
        </p>
        <p className="mt-4 text-2xl font-medium text-stone-800 dark:text-stone-200">
          {skipped ? "Skipped" : `${count} / ${target}`}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {!skipped && (
            <>
              <button
                type="button"
                onClick={onLog}
                disabled={pending}
                className="flex-1 min-w-[80px] py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium"
              >
                +
              </button>
              <button
                type="button"
                onClick={onUnlog}
                disabled={pending || count === 0}
                className="flex-1 min-w-[80px] py-3 rounded-xl border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-50 font-medium"
              >
                Undo
              </button>
            </>
          )}
          <button
            type="button"
            onClick={skipped ? onUnskip : onSkip}
            disabled={pending}
            className="flex-1 min-w-[80px] py-3 rounded-xl border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
          >
            {skipped ? "Unskip" : "Skip day"}
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
        >
          Close
        </button>
      </div>
    </>
  );
}
