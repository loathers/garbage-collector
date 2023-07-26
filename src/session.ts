import { Item, print } from "kolmafia";
import { property, Session, set } from "libram";
import { globalOptions } from "./config";
import { formatNumber, HIGHLIGHT, resetDailyPreference } from "./lib";
import { failedWishes } from "./potions";
import { garboValue } from "./value";

function printSession(session: Session): void {
  const value = session.value(garboValue);
  const printProfit = (details: { item: Item; value: number; quantity: number }[]) => {
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
  print(`Of that, ${value.meat} came from meat and ${value.items} came from items`);
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
}
