"use client";

import { useState } from "react";
import { verifyPassword } from "@/app/actions/auth";

export function LockScreen() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await verifyPassword(formData);
    setPending(false);
    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error ?? "Wrong password");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-900 px-6">
      <div className="w-full max-w-xs rounded-2xl bg-white dark:bg-stone-800 shadow-lg p-6 border border-stone-200 dark:border-stone-700">
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 text-center mb-2">
          Habits
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center mb-6">
          Enter password to continue
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            disabled={pending}
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {pending ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
