import {
  inebrietyLimit,
  Item,
  myAdventures,
  myInebriety,
  print,
  todayToString,
  totalTurnsPlayed,
} from "kolmafia";
import { $items, get, property, Session, set } from "libram";
import { globalOptions } from "./config";
import { formatNumber, HIGHLIGHT, resetDailyPreference } from "./lib";
import { failedWishes } from "./potions";
import { garboValue } from "./value";

type SessionKey = "full" | "barf" | "marginal-start" | "marginal-end";
const sessionFile = (key: SessionKey) => `garbo-${key}.json`;
const sessions: Map<SessionKey, Session> = new Map();
/**
 * Start a new session, deleting any old session
 */
function startSession(key: SessionKey): Session {
  const session = Session.current();
  sessions.set(key, session);
  return session;
}

function loadSession(key: SessionKey, force = false): Session {
  const trackingDate = get("_garboMpaTrackingDate", "");
  if (trackingDate !== "" && !force) {
    const session = Session.fromFile(sessionFile(key));
    sessions.set(key, session);
    return session;
  } else {
    return startSession(key);
  }
}

export function writeSessions(): void {
  set("_garboMpaTrackingDate", todayToString());
  for (const [key, session] of sessions.entries()) {
    session.toFile(sessionFile(key));
  }
}

export function tryStartSession(key: SessionKey, force = false): Session {
  const session = sessions.get(key);
  if (session) {
    return session;
  } else {
    return loadSession(key, force);
  }
}

/**
 * Compute the difference between the current drops and starting session (if any)
 * @returns The difference
 */
export function sessionSinceStart(): Session {
  const session = sessions.get("full");
  if (session) {
    return Session.current().diff(session);
  }
  return Session.current();
}

const excess = { item: 0, meat: 0 };
let thisTurnExcessFamiliar = 0;
export function setMarginalFamiliarsExcessValue(val: number): void {
  thisTurnExcessFamiliar = Math.max(0, val);
}

// Hardcode a few outliers that we know aren't marginal
// (e.g. those that have a drop limit which we would likely already cap)
// Note that familiar drops (that have limits) are already handled above
const outlierItemList = $items`Extrovermectin™, Volcoino, Poké-Gro fertilizer`;

export function trackBarfSessionStatistics(): void {
  // If we are overdrunk or at the end of the day (< 25 adv left), don't track statistics
  const finalAdventures = 25 + globalOptions.saveTurns;

  if (myInebriety() > inebrietyLimit() || myAdventures() < finalAdventures) return;

  // Start barfSession if we have not done so
  const barfSession = tryStartSession("barf");

  if (
    totalTurnsPlayed() - barfSession.totalTurns > 100 ||
    (myAdventures() <= finalAdventures + 200 && myAdventures() > finalAdventures)
  ) {
    tryStartSession("marginal-start");
    excess.item += thisTurnExcessFamiliar;

    // after every barf turn, recalculate marginal-end
    startSession("marginal-end");
  }
}

function printMarginalSession(): void {
  const barfSession = sessions.get("barf");
  const marginalStart = sessions.get("marginal-start");
  const marginalEnd = sessions.get("marginal-end");

  if (
    myInebriety() > inebrietyLimit() ||
    myAdventures() > globalOptions.saveTurns ||
    !barfSession ||
    !marginalStart ||
    !marginalEnd
  ) {
    return;
  }

  const { itemDetails: barfItemDetails } = barfSession.value(garboValue);
  const isOutlier = (detail: { item: Item; value: number; quantity: number }) =>
    outlierItemList.includes(detail.item) ||
    (detail.quantity === 1 &&
      detail.value >= 5000 &&
      barfItemDetails.some((d) => d.item === detail.item && d.quantity <= 2));

  const marginalSession = marginalEnd.diff(marginalStart);
  const stats = marginalSession.computeMPA(garboValue, isOutlier, excess);

  print(`Outliers:`, HIGHLIGHT);
  for (const detail of stats.outlierItems) {
    print(`${detail.quantity} ${detail.item} worth ${detail.value.toFixed(0)} total`, HIGHLIGHT);
  }
  print(
    `Marginal MPA: ${formatNumber(Math.round(stats.mpa.meat * 100) / 100)} [raw] + ${formatNumber(
      Math.round(stats.mpa.items * 100) / 100,
    )} [items] (${formatNumber(
      Math.round((stats.mpa.total - stats.mpa.effective) * 100) / 100,
    )} [outliers]) = ${formatNumber(
      Math.round(stats.mpa.effective * 100) / 100,
    )} [total] (${formatNumber(Math.round(stats.mpa.total * 100) / 100)} [w/ outliers])`,
    HIGHLIGHT,
  );
}

export function endSession(printLog = true): void {
  if (resetDailyPreference("garboResultsDate")) {
    set("garboResultsMeat", 0);
    set("garboResultsItems", 0);
  }
  const message = (head: string, meat: number, items: number) =>
    print(
      `${head}, you generated ${formatNumber(meat + items)} meat, with ${formatNumber(
        meat,
      )} raw meat and ${formatNumber(items)} from items`,
      HIGHLIGHT,
    );

  const { meat, items, itemDetails } = sessionSinceStart().value(garboValue);
  const totalMeat = meat + property.getNumber("garboResultsMeat", 0);
  const totalItems = items + property.getNumber("garboResultsItems", 0);

  if (printLog) {
    // list the top 3 gaining and top 3 losing items
    const losers = itemDetails.sort((a, b) => a.value - b.value).slice(0, 3);
    const winners = itemDetails.reverse().slice(0, 3);
    print(`Extreme Items:`, HIGHLIGHT);
    for (const detail of [...winners, ...losers]) {
      print(`${detail.quantity} ${detail.item} worth ${detail.value.toFixed(0)} total`, HIGHLIGHT);
    }
  }

  set("garboResultsMeat", totalMeat);
  set("garboResultsItems", totalItems);

  if (printLog) {
    message("This run of garbo", meat, items);
    message("So far today", totalMeat, totalItems);

    printMarginalSession();
    if (globalOptions.quick) {
      print("Quick mode was enabled, results may be less accurate than normal.");
    }
  }
  if (globalOptions.loginvalidwishes) {
    if (failedWishes.length === 0) {
      print("No invalid wishes found.");
    } else {
      print("Found the following unwishable effects:");
      failedWishes.forEach((effect) => print(`${effect}`));
    }
  }
  writeSessions();
}
