import {
  canadiaAvailable,
  chatPrivate,
  gnomadsAvailable,
  sessionStorage,
  todayToString,
} from "kolmafia";
import { get } from "libram";

const REPORT_RECIPIENT = "Jalen_Arbuckle";
const DATE_KEY = "garbo_reported_date";

const ALL_KEYS = ["snootee", "microbewery", "jickjar"] as const;
type ReportKey = (typeof ALL_KEYS)[number];

function storageKey(key: ReportKey): string {
  return `garbo_reported_${key}`;
}

function ensureCurrentDay(): void {
  const today = todayToString();

  // If we are already tracking values for the current day, consider this ensured.
  if (sessionStorage.getItem(DATE_KEY) === today) return;

  // Otherwise, clear all keys to allow reporting for the new day.
  for (const key of ALL_KEYS) {
    sessionStorage.removeItem(storageKey(key));
  }
  sessionStorage.setItem(DATE_KEY, today);
}

/**
 * Send a daily report value via private message. Uses sessionStorage
 * to ensure each key is only reported once per gameday. Clears stored
 * keys when the gameday rolls over.
 */
export function reportDaily(key: ReportKey, value: string | number): void {
  ensureCurrentDay();
  if (sessionStorage.getItem(storageKey(key)) !== null) return;

  chatPrivate(REPORT_RECIPIENT, `${key}:${value}`);
  sessionStorage.setItem(storageKey(key), `${value}`);
}

type PrefWatcher = {
  pref: string;
  isFilled: (value: string) => boolean;
  key: () => ReportKey | null;
};

const PREF_WATCH_REPORTS: PrefWatcher[] = [
  {
    pref: "_dailySpecial",
    isFilled: (value) => value !== "",
    key: () =>
      canadiaAvailable()
        ? "snootee"
        : gnomadsAvailable()
          ? "microbewery"
          : null,
  },
  {
    pref: "_jickJarAvailable",
    isFilled: (value) => value !== "unknown",
    key: () => "jickjar",
  },
];

/**
 * Check all pref-watch reports and send any that are newly filled.
 * Call this at any convenient hook point during the run.
 */
export function checkPrefWatchReports(): void {
  ensureCurrentDay();
  for (const report of PREF_WATCH_REPORTS) {
    const key = report.key();
    if (key === null) continue;
    if (sessionStorage.getItem(storageKey(key)) !== null) continue;

    const value = get(report.pref, "");
    if (!report.isFilled(value)) continue;

    reportDaily(key, value);
  }
}
