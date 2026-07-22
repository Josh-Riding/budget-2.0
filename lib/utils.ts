import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a date-only string ("YYYY-MM-DD", as returned by Postgres `date`
 * columns) into a local-time Date at midnight.
 *
 * `new Date("2026-07-01")` parses as UTC midnight, which renders as the
 * previous day/month in negative-UTC-offset timezones. Building the Date from
 * integer components keeps it anchored to the intended calendar day locally.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Convert a date-only string ("YYYY-MM-DD") to a "MM/YYYY" month key using
 * pure string manipulation — never touches Date, so it is timezone-safe.
 */
export function monthKey(dateStr: string): string {
  const [y, m] = dateStr.split("-")
  return `${m}/${y}`
}

/**
 * Given a "MM/YYYY" month, return the half-open date range covering it:
 * { start: "YYYY-MM-01", end: "YYYY-MM-01" of the following month }.
 * Pure string manipulation — timezone-safe. Moved here from queries.ts so it
 * can be imported/tested without loading the database client.
 */
export function getMonthDateRange(month: string): { start: string; end: string } {
  const [mm, yyyy] = month.split("/")
  const year = parseInt(yyyy)
  const mon = parseInt(mm)
  const start = `${yyyy}-${mm}-01`
  const nextMonth = mon === 12 ? 1 : mon + 1
  const nextYear = mon === 12 ? year + 1 : year
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`
  return { start, end }
}
