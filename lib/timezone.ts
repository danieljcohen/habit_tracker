/**
 * Timezone helpers: we store occurredAt in UTC (timestamptz).
 * "Day" is defined by local date in America/New_York (configurable).
 * We compute local day start/end as UTC instants for querying HabitLog.
 */
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { addDays } from "date-fns";

const DEFAULT_TZ = "America/New_York";

/**
 * Given a local date string (YYYY-MM-DD) in the app timezone, return the UTC
 * instant of the start of that day (00:00:00 local).
 */
export function localDayStartUTC(localDateISO: string, tz = DEFAULT_TZ): Date {
  const zoned = fromZonedTime(`${localDateISO}T00:00:00`, tz);
  return zoned;
}

/**
 * Given a local date string (YYYY-MM-DD), return the UTC instant of the end
 * of that day (23:59:59.999 local).
 */
export function localDayEndUTC(localDateISO: string, tz = DEFAULT_TZ): Date {
  const zoned = fromZonedTime(`${localDateISO}T23:59:59.999`, tz);
  return zoned;
}

/**
 * Convert a UTC Date to the local date string (YYYY-MM-DD) in the app timezone.
 */
export function utcToLocalDateString(utc: Date | number, tz = DEFAULT_TZ): string {
  return formatInTimeZone(utc, tz, "yyyy-MM-dd");
}

/**
 * Get the Monday of the week that contains the given local date (YYYY-MM-DD).
 * Week starts Monday. Uses app TZ for consistency.
 */
export function getWeekStartMonday(localDateISO: string, tz = DEFAULT_TZ): string {
  const utc = fromZonedTime(localDateISO + "T12:00:00", tz);
  const day = toZonedTime(utc, tz).getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const mondayZoned = addDays(toZonedTime(utc, tz), mondayOffset);
  return formatInTimeZone(mondayZoned, tz, "yyyy-MM-dd");
}

/**
 * Return array of 7 local date strings (Mon..Sun) for the week that contains the given date.
 */
export function getWeekDates(localDateISO: string, tz = DEFAULT_TZ): string[] {
  const start = getWeekStartMonday(localDateISO, tz);
  const ref = fromZonedTime(start + "T12:00:00", tz);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(ref, i);
    dates.push(formatInTimeZone(d, tz, "yyyy-MM-dd"));
  }
  return dates;
}
