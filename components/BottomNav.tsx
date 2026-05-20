"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/tasks", label: "Today", icon: "✓" },
  { href: "/week", label: "Week", icon: "📅" },
  { href: "/metrics", label: "Metrics", icon: "📊" },
  { href: "/coach", label: "Coach", icon: "💬" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white/95 dark:bg-stone-900/95 border-t border-stone-200 dark:border-stone-700 pb-safe pt-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {tabs.map(({ href, label, icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 min-w-[72px] py-1 rounded-lg transition-colors ${
              isActive
                ? "text-teal-600 dark:text-teal-400 font-medium"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
          >
            <span className="text-lg" aria-hidden>
              {icon}
            </span>
            <span className="text-xs">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
