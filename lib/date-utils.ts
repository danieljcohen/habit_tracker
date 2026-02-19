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
  const m = new Date(first + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
  });
  const d1 = new Date(first + "T12:00:00").getDate();
  const d2 = new Date(last + "T12:00:00").getDate();
  return `${m} ${d1}–${d2}`;
}
