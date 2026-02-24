"use client";

import { useState } from "react";
import { askHabitCoach } from "@/app/actions/habit-coach";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function HabitCoachChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || pending) return;
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setPending(true);
    try {
      const res = await askHabitCoach({ question });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't answer right now. Please check your AI API key and try again.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
        Habit coach
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        Ask questions about how you&apos;re doing with your habits, food, and
        weight. The coach looks at your recent data and gives suggestions.
      </p>

      <div className="mb-4 max-h-[360px] overflow-y-auto space-y-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Try asking:{" "}
            <span className="italic">
              &ldquo;How did I do this week, and what should I focus on
              tomorrow?&rdquo;
            </span>
          </p>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-teal-600 text-white"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder="Ask the coach a question…"
          className="flex-1 resize-none rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || pending}
          className="self-end px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium"
        >
          Send
        </button>
      </form>
    </div>
  );
}

