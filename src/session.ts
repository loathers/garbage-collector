import {
  Coinmaster,
  inebrietyLimit,
  Item,
  myAdventures,
  myInebriety,
  print,
  sellPrice,
  setProperty,
  toInt,
  totalTurnsPlayed,
} from "kolmafia";
import { $item, $items, get, getSaleValue, property, Session, set, sumNumbers } from "libram";
import { formatNumber, globalOptions, HIGHLIGHT, resetDailyPreference } from "./lib";

function currency(...items: Item[]): () => number {
  const unitCost: [Item, number][] = items.map((i) => {
    const coinmaster = Coinmaster.all().find((c) => sellPrice(c, i) > 0);
    if (!coinmaster) {
      throw `Invalid coinmaster item ${i}`;
    } else {
      return [i, sellPrice(coinmaster, i)];
    }
  });
  return () => Math.max(...unitCost.map(([item, cost]) => garboValue(item) / cost));
}

function complexCandy(): [Item, () => number][] {
  const candies = Item.all().filter((i) => i.candyType === "complex");
  const candyLookup: Item[][] = [[], [], [], [], []];

  for (const candy of candies) {
    const id = toInt(candy) % 5;
    if (candy.tradeable) {
      candyLookup[id].push(candy);
    }
  }
  const candyIdPrices: [Item, () => number][] = candies
    .filter((i) => !i.tradeable)
    .map((i) => [i, () => Math.min(...candyLookup[toInt(i) % 5].map((i) => garboValue(i)))]);
  return candyIdPrices;
}

const specialValueLookup = new Map<Item, () => number>([
  [
    $item`Freddy Kruegerand`,
    currency(...$items`bottle of Bloodweiser, electric Kool-Aid, Dreadsylvanian skeleton key`),
  ],
  [$item`Beach Buck`, currency($item`one-day ticket to Spring Break Beach`)],
  [$item`Coinspiracy`, currency(...$items`Merc Core deployment orders, karma shawarma`)],
  [$item`FunFunds™`, currency($item`one-day ticket to Dinseylandfill`)],
  [$item`Volcoino`, currency($item`one-day ticket to That 70s Volcano`)],
  [$item`Wal-Mart gift certificate`, currency($item`one-day ticket to The Glaciest`)],
  [$item`Rubee™`, currency($item`FantasyRealm guest pass`)],
  [$item`Guzzlrbuck`, currency($item`Never Don't Stop Not Striving`)],
  ...complexCandy(),
  [
    $item`Merc Core deployment orders`,
    () => garboValue($item`one-day ticket to Conspiracy Island`),
  ],
  [
    $item`free-range mushroom`,
    () =>
      3 *
      Math.max(
        garboValue($item`mushroom tea`) - garboValue($item`soda water`),
        garboValue($item`mushroom whiskey`) - garboValue($item`fermenting powder`),
        garboValue($item`mushroom filet`)
      ),
  ],
  [
    $item`little firkin`,
    () =>
      garboAverageValue(
        ...$items`martini, screwdriver, strawberry daiquiri, margarita, vodka martini, tequila sunrise, bottle of Amontillado, barrel-aged martini, barrel gun`
      ),
  ],
  [
    $item`normal barrel`,
    () =>
      garboAverageValue(
        ...$items`a little sump'm sump'm, pink pony, rockin' wagon, roll in the hay, slip 'n' slide, slap and tickle`
      ),
  ],
  [
    $item`big tun`,
    () =>
      garboAverageValue(
        ...$items`gibson, gin and tonic, mimosette, tequila sunset, vodka and tonic, zmobie`
      ),
  ],
  [
    $item`weathered barrel`,
    () => garboAverageValue(...$items`bean burrito, enchanted bean burrito, jumping bean burrito`),
  ],
  [
    $item`dusty barrel`,
    () =>
      garboAverageValue(
        ...$items`spicy bean burrito, spicy enchanted bean burrito, spicy jumping bean burrito`
      ),
  ],
  [
    $item`disintegrating barrel`,
    () =>
      garboAverageValue(
        ...$items`insanely spicy bean burrito, insanely spicy enchanted bean burrito, insanely spicy jumping bean burrito`
      ),
  ],
  [
    $item`moist barrel`,
    () =>
      garboAverageValue(
        ...$items`cast, concentrated magicalness pill, enchanted barbell, giant moxie weed, Mountain Stream soda`
      ),
  ],
  [
    $item`rotting barrel`,
    () =>
      garboAverageValue(
        ...$items`Doc Galaktik's Ailment Ointment, extra-strength strongness elixir, jug-o-magicalness, Marquis de Poivre soda, suntan lotion of moxiousness`
      ),
  ],
  [
    $item`mouldering barrel`,
    () =>
      garboAverageValue(
        ...$items`creepy ginger ale, haunted battery, scroll of drastic healing, synthetic marrow, the funk`
      ),
  ],
  [
    $item`barnacled barrel`,
    () =>
      garboAverageValue(
        ...$items`Alewife™ Ale, bazookafish bubble gum, beefy fish meat, eel battery, glistening fish meat, ink bladder, pufferfish spine, shark cartilage, slick fish meat, slug of rum, slug of shochu, slug of vodka, temporary teardrop tattoo`
      ),
  ],
  [$item`fake hand`, () => 50000],
]);

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
}

const garboValueCache = new Map<Item, number>();
export function garboValue(item: Item): number {
  const cachedValue = garboValueCache.get(item);
  if (cachedValue === undefined) {
    const specialValueCompute = specialValueLookup.get(item);
    const value = specialValueCompute ? specialValueCompute() : getSaleValue(item);
    garboValueCache.set(item, value);
    return value;
  }
  return cachedValue;
}
export function garboAverageValue(...items: Item[]): number {
  return sumNumbers(items.map(garboValue)) / items.length;
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
let barfSession: Session | null = null;
let barfSessionStartTurns = totalTurnsPlayed();
let continueMeatTracking = true;
let numTrackedItemTurns: number | null = null;
export function trackBarfSessionStatistics(): void {
  // If we are overdrunk, don't track statistics
  if (myInebriety() > inebrietyLimit()) return;

  // Start barfSession if we have not done so
  if (!barfSession) {
    barfSession = Session.current();
    barfSessionStartTurns = myAdventures();
  }

  // Start tracking items if at least one of these is true
  // 1) We have run at least 100 barf turns
  // 2) We have less than 200 adv to run
  if (
    !marginalSession &&
    (totalTurnsPlayed() - barfSessionStartTurns >= 100 ||
      (myAdventures() <= 200 + globalOptions.saveTurns && myAdventures() > globalOptions.saveTurns))
  ) {
    marginalSession = Session.current();
    numTrackedItemTurns = myAdventures() - globalOptions.saveTurns;
  }

  // Start tracking meat if we have less than 75 turns left
  // Also create a backup tracker for items
  if (
    (!get("_garboMarginalMeatCheckpoint") || !get("_garboMarginalMeatTurns")) &&
    myAdventures() - 25 - globalOptions.saveTurns <= 50 &&
    myAdventures() > 25 + globalOptions.saveTurns
  ) {
    const { meat, items } = sessionSinceStart().value(garboValue);
    const numTrackedMeatTurns = myAdventures() - 25 - globalOptions.saveTurns;
    setProperty("_garboMarginalMeatCheckpoint", meat.toFixed(0));
    setProperty("_garboMarginalItemCheckpoint", items.toFixed(0));
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
    const itemDiff = items - get("_garboMarginalItemCheckpoint", 0);
    setProperty("_garboMarginalMeatValue", meatDiff.toFixed(0));
    setProperty("_garboMarginalItemValue", itemDiff.toFixed(0));
  }
}

function printMarginalSession(): void {
  if (myInebriety() > inebrietyLimit() || myAdventures() > globalOptions.saveTurns) return;

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
      marginalSession &&
      barfSession &&
      numTrackedItemTurns &&
      numTrackedItemTurns >= Math.max(50, meatTurns)
    ) {
      const { items, itemDetails } = Session.current().diff(marginalSession).value(garboValue);
      const barfItemDetails = Session.current().diff(barfSession).value(garboValue).itemDetails;
      const outlierItemDetails = itemDetails
        .filter(
          (detail) =>
            detail.quantity === 1 &&
            detail.value >= 1000 &&
            barfItemDetails.some((d) => d.item === detail.item && d.quantity <= 2)
        )
        .sort((a, b) => b.value - a.value);
      print(`Outliers:`, HIGHLIGHT);
      let outlierItems = 0;
      for (const detail of outlierItemDetails) {
        print(
          `${detail.quantity} ${detail.item} worth ${detail.value.toFixed(0)} total`,
          HIGHLIGHT
        );
        outlierItems += detail.value;
      }
      const outlierIPA = items / numTrackedItemTurns;
      const IPA = (items - outlierItems) / numTrackedItemTurns;
      const totalOutlierMPA = MPA + outlierIPA;
      const totalMPA = MPA + IPA;
      print(
        `Marginal MPA: ${formatNumber(Math.round(MPA * 100) / 100)} [raw] + ${formatNumber(
          Math.round(IPA * 100) / 100
        )} [items] (${formatNumber(
          Math.round(outlierIPA * 100) / 100
        )} [outliers]) = ${formatNumber(Math.round(totalMPA * 100) / 100)} [total] (${formatNumber(
          Math.round(totalOutlierMPA * 100) / 100
        )} [w/ outliers])`,
        HIGHLIGHT
      );
    } else if (get("_garboMarginalItemValue")) {
      const items = get("_garboMarginalMeatValue", 0);
      const IPA = items / meatTurns;
      const totalMPA = MPA + IPA;
      print(
        `Marginal MPA: ${formatNumber(Math.round(MPA * 100) / 100)} [raw] + ${formatNumber(
          Math.round(IPA * 100) / 100
        )} [items] = ${formatNumber(Math.round(totalMPA * 100) / 100)} [total]`,
        HIGHLIGHT
      );
    }
  }
}

export function printGarboSession(): void {
  if (resetDailyPreference("garboResultsDate")) {
    set("garboResultsMeat", 0);
    set("garboResultsItems", 0);
  }
  const message = (head: string, meat: number, items: number) =>
    print(
      `${head}, you generated ${formatNumber(meat + items)} meat, with ${formatNumber(
        meat
      )} raw meat and ${formatNumber(items)} from items`,
      HIGHLIGHT
    );

  const { meat, items, itemDetails } = sessionSinceStart().value(garboValue);
  const totalMeat = meat + property.getNumber("garboResultsMeat", 0);
  const totalItems = items + property.getNumber("garboResultsItems", 0);

  // list the top 3 gaining and top 3 losing items
  const losers = itemDetails.sort((a, b) => a.value - b.value).slice(0, 3);
  const winners = itemDetails.sort((a, b) => b.value - a.value).slice(0, 3);
  print(`Extreme Items:`, HIGHLIGHT);
  for (const detail of [...winners, ...losers]) {
    print(`${detail.quantity} ${detail.item} worth ${detail.value.toFixed(0)} total`, HIGHLIGHT);
  }

  set("garboResultsMeat", totalMeat);
  set("garboResultsItems", totalItems);

  message("This run of garbo", meat, items);
  message("So far today", totalMeat, totalItems);

  printMarginalSession();
}
