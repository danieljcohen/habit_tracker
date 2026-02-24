import { formatInTimeZone } from "date-fns-tz";

const DEFAULT_TZ = "America/New_York";

export function todayISO(tz = DEFAULT_TZ): string {
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
}

export function formatShortDay(dateISO: string): string {
  const d = new Date(dateISO + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatDayNum(dateISO: string): string {
  const d = new Date(dateISO + "T12:00:00");
  return d.getDate().toString();
}

export function formatWeekRange(weekDates: string[]): string {
  if (weekDates.length < 2) return weekDates[0] ?? "";
  const first = weekDates[0];
  const last = weekDates[6];
  const firstDate = new Date(first + "T12:00:00");
  const lastDate = new Date(last + "T12:00:00");
  const m1 = firstDate.toLocaleDateString("en-US", { month: "short" });
  const m2 = lastDate.toLocaleDateString("en-US", { month: "short" });
  const d1 = firstDate.getDate();
  const d2 = lastDate.getDate();
  if (m1 === m2) {
    return `${m1} ${d1}–${d2}`;
  }
  return `${m1} ${d1}–${m2} ${d2}`;
}
