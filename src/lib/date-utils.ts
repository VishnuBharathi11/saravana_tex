import { format, parseISO, isValid } from "date-fns";

/**
 * Formats a date string (e.g. YYYY-MM-DD or ISO string) to DD/MM/YYYY.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const parsed = typeof date === "string" ? parseISO(date) : date;
    if (isValid(parsed)) {
      return format(parsed, "dd/MM/yyyy");
    }
  } catch (e) {
    return String(date);
  }
  return String(date);
}

/**
 * Formats a time string or Date to HH:mm
 */
export function formatTime(timeOrDate: string | Date | null | undefined): string {
  if (!timeOrDate) return "";
  try {
    // If it's just a time string like "14:30", return it
    if (typeof timeOrDate === "string" && /^\d{2}:\d{2}$/.test(timeOrDate)) {
      return timeOrDate;
    }
    const parsed = typeof timeOrDate === "string" ? parseISO(timeOrDate) : timeOrDate;
    if (isValid(parsed)) {
      return format(parsed, "HH:mm");
    }
  } catch (e) {
    return String(timeOrDate);
  }
  return String(timeOrDate);
}

/**
 * Formats a date string and optional time string to DD/MM/YYYY · HH:mm
 * Example: formatDateTime("2026-08-18", "12:30") -> "18/08/2026 · 12:30"
 * Example: formatDateTime("2026-08-18T12:30:00Z") -> "18/08/2026 · 12:30"
 */
export function formatDateTime(date: string | Date | null | undefined, time?: string): string {
  if (!date) return "";
  const d = formatDate(date);
  
  if (time) {
    return `${d} · ${time}`;
  }
  
  // Try to extract time from Date object or ISO string if no explicit time is given
  if (typeof date !== "string" || date.includes("T")) {
    try {
      const parsed = typeof date === "string" ? parseISO(date) : date;
      if (isValid(parsed)) {
        const t = format(parsed, "HH:mm");
        if (t !== "00:00") { // Just in case it's a date-only but parsed as midnight local
          return `${d} · ${t}`;
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  return d;
}
