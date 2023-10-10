import {
  inebrietyLimit,
  Item,
  myAdventures,
  myInebriety,
  print,
  setProperty,
  totalTurnsPlayed,
} from "kolmafia";
import { $items, get, Session, set } from "libram";
import { globalOptions } from "./config";
import { formatNumber, HIGHLIGHT, resetDailyPreference } from "./lib";
import { failedWishes } from "./potions";
import { garboValue } from "./garboValue";

function printSession(session: Session): void {
  const value = session.value(garboValue);
  const printProfit = (
    details: { item: Item; value: number; quantity: number }[],
  ) => {
    for (const { item, quantity, value } of details) {
      print(`  ${item} (${quantity}) @ ${Math.floor(value)}`);
    }
  };
  const lowValue = value.itemDetails
    .filter((detail) => detail.value < 0)
    .sort((a, b) => a.value - b.value);
  const highValue = value.itemDetails
    .filter((detail) => detail.value > 0)
    .sort((a, b) => b.value - a.value);

  print(`Total Session Value: ${value.total}`);
  print(
    `Of that, ${value.meat} came from meat and ${value.items} came from items`,
  );
  print(` You gained meat on ${highValue.length} items including:`);
  printProfit(highValue);
  print(` You lost meat on ${lowValue.length} items including:`);
  printProfit(lowValue);
  if (globalOptions.quick) {
    print("Quick mode was enabled, results may be less accurate than normal.");
  }
}

let session: Session | null = null;
/**
 * Start a new session, deleting any old session
 */
export function startSession(): void {
  session = Session.current();
}

/**
 * Compute the difference between the current drops and starting session (if any)
 * @returns The difference
 */
export function sessionSinceStart(): Session {
  if (session) {
    return Session.current().diff(session);
  }
  return Session.current();
}

export function valueSession(): void {
  printSession(Session.current());
  Session.current().toFile("test.json");
}

let marginalSession: Session | null = null;
let marginalSessionDiff: Session | null = null;
let barfSession: Session | null = null;
let barfSessionStartTurns = totalTurnsPlayed();
let continueMeatTracking = true;
let numTrackedItemTurns: number | null = null;
let marginalFamiliarsExcessValue = 0;
export function setMarginalFamiliarsExcessValue(val: number): void {
  marginalFamiliarsExcessValue = Math.max(0, val);
}
let marginalFamiliarsExcessTotal = 0;

// Hardcode a few outliers that we know aren't marginal
// (e.g. those that have a drop limit which we would likely already cap)
// Note that familiar drops (that have limits) are already handled above
const outlierItemList = $items`Extrovermectin™, Volcoino, Poké-Gro fertilizer`;

export function trackBarfSessionStatistics(): void {
  // If we are overdrunk, don't track statistics
  if (myInebriety() > inebrietyLimit()) return;

  // Start barfSession if we have not done so
  if (!barfSession) {
    barfSession = Session.current();
    barfSessionStartTurns = totalTurnsPlayed();
  }

  // Start tracking items if at least one of these is true
  // 1) We have run at least 100 barf turns
  // 2) We have less than 200 adv to run
  if (
    !marginalSession &&
    (totalTurnsPlayed() - barfSessionStartTurns >= 100 ||
      (myAdventures() <= 200 + 25 + globalOptions.saveTurns &&
        myAdventures() > globalOptions.saveTurns + 25))
  ) {
    marginalSession = Session.current();
    numTrackedItemTurns = myAdventures() - globalOptions.saveTurns - 25;
  }

  // Start tracking meat if we have less than 75 turns left
  // Also create a backup tracker for items

  if (marginalSession) {
    marginalFamiliarsExcessTotal += marginalFamiliarsExcessValue;
  }
  marginalFamiliarsExcessValue = 0;

  if (
    (!get("_garboMarginalMeatCheckpoint") || !get("_garboMarginalMeatTurns")) &&
    myAdventures() - 25 - globalOptions.saveTurns <= 50 &&
    myAdventures() > 25 + globalOptions.saveTurns
  ) {
    const { meat, items } = sessionSinceStart().value(garboValue);
    const numTrackedMeatTurns = myAdventures() - 25 - globalOptions.saveTurns;
    setProperty("_garboMarginalMeatCheckpoint", meat.toFixed(0));
    setProperty(
      "_garboMarginalItemCheckpoint",
      (items - marginalFamiliarsExcessTotal).toFixed(0),
    );
    setProperty("_garboMarginalMeatTurns", numTrackedMeatTurns.toFixed(0));
  }

  // Stop tracking meat if we have less than 25 turns left
  if (
    get("_garboMarginalMeatCheckpoint") &&
    get("_garboMarginalMeatTurns") &&
    continueMeatTracking &&
    myAdventures() - 25 - globalOptions.saveTurns <= 0
  ) {
    continueMeatTracking = false;
    const { meat, items } = sessionSinceStart().value(garboValue);
    const meatDiff = meat - get("_garboMarginalMeatCheckpoint", 0);
    const itemDiff =
      items -
      marginalFamiliarsExcessTotal -
      get("_garboMarginalItemCheckpoint", 0);
    setProperty("_garboMarginalMeatValue", meatDiff.toFixed(0));
    setProperty("_garboMarginalItemValue", itemDiff.toFixed(0));
    if (marginalSession) {
      marginalSessionDiff = Session.current().diff(marginalSession);
    }
  }
}

function printMarginalSession(): void {
  if (
    myInebriety() > inebrietyLimit() ||
    myAdventures() > globalOptions.saveTurns
  ) {
    return;
  }

  if (get("_garboMarginalMeatValue") && get("_garboMarginalMeatTurns")) {
    const meat = get("_garboMarginalMeatValue", 0);
    const meatTurns = get("_garboMarginalMeatTurns", 0);

    if (meatTurns <= 0) {
      print("Error in estimating marginal MPA - meat turns tracked = 0", "red");
      return;
    }

    const MPA = meat / meatTurns;

    // Only evaluate item outliers if we have run a good number of turns (to reduce variance)
    if (
      marginalSessionDiff &&
      barfSession &&
      numTrackedItemTurns &&
      numTrackedItemTurns >= Math.max(50, meatTurns)
    ) {
      const { items, itemDetails } = marginalSessionDiff.value(garboValue);
      const barfItemDetails = Session.current()
        .diff(barfSession)
        .value(garboValue).itemDetails;
      const outlierItemDetails = itemDetails
        .filter(
          (detail) =>
            outlierItemList.includes(detail.item) ||
            (detail.quantity === 1 &&
              detail.value >= 5000 &&
              barfItemDetails.some(
                (d) => d.item === detail.item && d.quantity <= 2,
              )),
        )
        .sort((a, b) => b.value - a.value);
      print(`Outliers:`, HIGHLIGHT);
      let outlierItems = 0;
      for (const detail of outlierItemDetails) {
        print(
          `${detail.quantity} ${detail.item} worth ${detail.value.toFixed(
            0,
          )} total`,
          HIGHLIGHT,
        );
        outlierItems += detail.value;
      }
      const outlierIPA =
        (items - marginalFamiliarsExcessTotal) / numTrackedItemTurns;
      const IPA =
        (items - marginalFamiliarsExcessTotal - outlierItems) /
        numTrackedItemTurns;
      const totalOutlierMPA = MPA + outlierIPA;
      const totalMPA = MPA + IPA;
      print(
        `Marginal MPA: ${formatNumber(
          Math.round(MPA * 100) / 100,
        )} [raw] + ${formatNumber(
          Math.round(IPA * 100) / 100,
        )} [items] (${formatNumber(
          Math.round(outlierIPA * 100) / 100,
        )} [outliers]) = ${formatNumber(
          Math.round(totalMPA * 100) / 100,
        )} [total] (${formatNumber(
          Math.round(totalOutlierMPA * 100) / 100,
        )} [w/ outliers])`,
        HIGHLIGHT,
      );
    } else if (get("_garboMarginalItemValue")) {
      const items = get("_garboMarginalItemValue", 0);
      const IPA = items / meatTurns;
      const totalMPA = MPA + IPA;
      print(
        "Warning: Insufficient turns were run, so this estimate is subject to large variance. Be careful when using these values as is.",
        "red",
      );
      print(
        `Marginal MPA: ${formatNumber(
          Math.round(MPA * 100) / 100,
        )} [raw] + ${formatNumber(
          Math.round(IPA * 100) / 100,
        )} [items] = ${formatNumber(Math.round(totalMPA * 100) / 100)} [total]`,
        HIGHLIGHT,
      );
    }
  }
}

const garboResultsProperties = [
  "garboResultsMeat",
  "garboResultsItems",
  "garboResultsTurns",
] as const;
type GarboResultsProperty = (typeof garboResultsProperties)[number];

function getGarboDaily(property: GarboResultsProperty): number {
  return get(property, 0);
}
function setGarboDaily(property: GarboResultsProperty, value: number) {
  set(property, value);
}
function resetGarboDaily() {
  if (resetDailyPreference("garboResultsDate")) {
    for (const prop of garboResultsProperties) {
      setGarboDaily(prop, 0);
    }
  }
}

export function endSession(printLog = true): void {
  resetGarboDaily();
  const message = (head: string, turns: number, meat: number, items: number) =>
    print(
      `${head}, across ${formatNumber(
        turns,
      )} turns you generated ${formatNumber(
        meat + items,
      )} meat, with ${formatNumber(meat)} raw meat and ${formatNumber(
        items,
      )} from items`,
      HIGHLIGHT,
    );

  const { meat, items, itemDetails, turns } =
    sessionSinceStart().value(garboValue);
  const totalMeat = meat + getGarboDaily("garboResultsMeat");
  const totalItems = items + getGarboDaily("garboResultsItems");
  const totalTurns = turns + getGarboDaily("garboResultsTurns");

  if (printLog) {
    // list the top 3 gaining and top 3 losing items
    const losers = itemDetails.sort((a, b) => a.value - b.value).slice(0, 3);
    const winners = itemDetails.reverse().slice(0, 3);
    print(`Extreme Items:`, HIGHLIGHT);
    for (const detail of [...winners, ...losers]) {
      print(
        `${detail.quantity} ${detail.item} worth ${detail.value.toFixed(
          0,
        )} total`,
        HIGHLIGHT,
      );
    }
  }

  setGarboDaily("garboResultsMeat", totalMeat);
  setGarboDaily("garboResultsItems", totalItems);
  setGarboDaily("garboResultsTurns", totalTurns);

  if (printLog) {
    message("This run of garbo", turns, meat, items);
    message("So far today", totalTurns, totalMeat, totalItems);

    printMarginalSession();
    if (globalOptions.quick) {
      print(
        "Quick mode was enabled, results may be less accurate than normal.",
      );
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
}
