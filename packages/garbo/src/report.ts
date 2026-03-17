import {
  canadiaAvailable,
  chatPrivate,
  daycount,
  gnomadsAvailable,
  myId,
  sessionStorage,
  toInt,
} from "kolmafia";
import { Delayed, get, undelay } from "libram";

const REPORT_RECIPIENT = "Jalen_Arbuckle";

const REPORT_KEYS = [
  "snootee",
  "microbrewery",
  "jickjar",
  "votemonster",
  "g9",
] as const;
type ReportKey = (typeof REPORT_KEYS)[number];

function isReportKey(value: string): value is ReportKey {
  return (REPORT_KEYS as readonly string[]).includes(value);
}

function sessionStorageKey(): string {
  return `garbo_reported_${daycount()}`;
}

function getReportedKeys(): Set<ReportKey> {
  return new Set(
    (sessionStorage.getItem(sessionStorageKey()) ?? "")
      .split(",")
      .filter(isReportKey),
  );
}

function markReported(key: ReportKey): void {
  const reported = getReportedKeys();
  reported.add(key);
  sessionStorage.setItem(sessionStorageKey(), [...reported].join(","));
}

/**
 * Send a daily report value via private message. Uses sessionStorage
 * to ensure each key is only reported once per gameday. The storage key
 * includes the gameday, so old entries are naturally orphaned on rollover.
 */
export function reportDaily(key: ReportKey, value: string | number): void {
  if (getReportedKeys().has(key)) return;

  chatPrivate(REPORT_RECIPIENT, `${key}:${value}`);
  markReported(key);
}

type PrefWatcher = {
  pref: string;
  emptyValue?: string;
  key: Delayed<ReportKey | null>;
  value?: (prefValue: string) => string | number | null;
};

const PREF_WATCH_REPORTS: PrefWatcher[] = [
  {
    pref: "_dailySpecial",
    key: () =>
      canadiaAvailable()
        ? "snootee"
        : gnomadsAvailable()
          ? "microbrewery"
          : null,
  },
  {
    pref: "_jickJarAvailable",
    emptyValue: "unknown",
    key: "jickjar",
    value: (prefValue) => (prefValue === "true" ? toInt(myId()) % 23 : null),
  },
  {
    pref: "_voteMonster",
    key: "votemonster",
  },
  {
    pref: "_g9Effect",
    emptyValue: "0",
    key: "g9",
  },
];

/**
 * Check all pref-watch reports and send any that are newly filled.
 * Call this at any convenient hook point during the run.
 */
export function checkPrefWatchReports(): void {
  const reported = getReportedKeys();
  for (const report of PREF_WATCH_REPORTS) {
    const key = undelay(report.key);
    if (key === null) continue;
    if (reported.has(key)) continue;

    const prefValue = get(report.pref, "");
    if (prefValue === (report.emptyValue ?? "")) continue;

    const value = report.value ? report.value(prefValue) : prefValue;
    if (value === null) continue;

    reportDaily(key, value);
  }
}
