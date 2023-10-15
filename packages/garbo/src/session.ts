import { Item, print } from "kolmafia";
import { $items, get, Session, set } from "libram";
import { globalOptions } from "./config";
import { formatNumber, HIGHLIGHT, resetDailyPreference } from "./lib";
import { failedWishes } from "./potions";
import { garboValue } from "./garboValue";
import { estimatedGarboTurns } from "./turns";

type SessionKey = "full" | "barf" | "meat-start" | "meat-end" | "item";
const sessions: Map<SessionKey, Session> = new Map();
/**
 * Start a new session, deleting any old session
 */
export function startSession(): void {
  sessions.set("full", Session.current());
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

let extraValue = 0;
export function trackMarginalTurnExtraValue(additionalValue: number) {
  extraValue += additionalValue;
}

export function trackMarginalMpa() {
  const barf = sessions.get("barf");
  const current = Session.current();
  if (!barf) {
    sessions.set("barf", Session.current());
  } else {
    const turns = barf.diff(current).totalTurns;
    // track items if we have run at least 100 turns in barf mountain or we have less than 200 turns left in barf mountain
    const item = sessions.get("item");
    if (!item && (turns > 100 || estimatedGarboTurns() <= 200)) {
      sessions.set("item", current);
    }
    // start tracking meat if there are less than 75 turns left in barf mountain
    const meatStart = sessions.get("meat-start");
    if (!meatStart && estimatedGarboTurns() <= 75) {
      sessions.set("meat-start", current);
    }

    // stop tracking meat if there are less than 25 turns left in barf moutain
    const meatEnd = sessions.get("meat-end");
    if (!meatEnd && estimatedGarboTurns() <= 25) {
      sessions.set("meat-end", current);
    }
  }
}

const outlierItemList = $items`Extrovermectin™, Volcoino, Poké-Gro fertilizer`;

function printMarginalSession() {
  const barf = sessions.get("barf");
  const meatStart = sessions.get("meat-start");
  const meatEnd = sessions.get("meat-end");
  const item = sessions.get("item");

  // we can only print out marginal items if we've started tracking for marginal value
  if (barf && meatStart && meatEnd) {
    const { itemDetails: barfItemDetails } = barf.value(garboValue);

    const isOutlier = (detail: {
      item: Item;
      value: number;
      quantity: number;
    }) =>
      outlierItemList.includes(detail.item) ||
      (detail.quantity === 1 &&
        detail.value >= 5000 &&
        barfItemDetails.some((d) => d.item === detail.item && d.quantity <= 2));

    const meatMpa = Session.computeMPA(meatStart, meatEnd, {
      value: garboValue,
      isOutlier,
    });

    if (item) {
      // MPA printout including maringal items
      const itemMpa = Session.computeMPA(item, Session.current(), {
        value: garboValue,
        isOutlier,
        excludeValue: { item: extraValue },
      });

      print(`Outliers:`, HIGHLIGHT);
      for (const detail of itemMpa.outlierItems) {
        print(
          `${detail.quantity} ${detail.item} worth ${detail.value.toFixed(
            0,
          )} total`,
          HIGHLIGHT,
        );
      }

      const effectiveMpa =
        itemMpa.mpa.effective - itemMpa.mpa.meat + meatMpa.mpa.meat;
      const totalMpa = itemMpa.mpa.total - itemMpa.mpa.meat + meatMpa.mpa.meat;

      print(
        `Marginal MPA: ${formatNumber(
          Math.round(meatMpa.mpa.meat * 100) / 100,
        )} [raw] + ${formatNumber(
          Math.round(itemMpa.mpa.items * 100) / 100,
        )} [items] (${formatNumber(
          Math.round((itemMpa.mpa.total - itemMpa.mpa.effective) * 100) / 100,
        )} [outliers]) = ${formatNumber(
          Math.round(effectiveMpa * 100) / 100,
        )} [total] (${formatNumber(
          Math.round(totalMpa * 100) / 100,
        )} [w/ outliers])`,
        HIGHLIGHT,
      );
    } else {
      // MPA printout excluding marginal items
      print(
        "Warning: Insufficient turns were run, so this estimate is subject to large variance. Be careful when using these values as is.",
        "red",
      );
      print(
        `Marginal MPA: ${formatNumber(
          Math.round(meatMpa.mpa.meat * 100) / 100,
        )} [raw] + ${formatNumber(
          Math.round(meatMpa.mpa.items * 100) / 100,
        )} [items] = ${formatNumber(
          Math.round(meatMpa.mpa.total * 100) / 100,
        )} [total]`,
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
