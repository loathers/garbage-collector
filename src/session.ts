import { print, sellPrice, toInt } from "kolmafia";
import { $item, $items, getSaleValue, property, Session, set, sumNumbers } from "libram";
import { formatNumber, HIGHLIGHT, resetDailyPreference } from "./lib";

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
    () =>
      garboAverageValue(
        ...$items`banana, bean burrito, enchanted bean burrito, jumping bean burrito`
      ),
  ],
  [
    $item`dusty barrel`,
    () =>
      garboAverageValue(
        ...$items`banana, spicy bean burrito, spicy enchanted bean burrito, spicy jumping bean burrito`
      ),
  ],
  [
    $item`disintegrating barrel`,
    () =>
      garboAverageValue(
        ...$items`banana, insanely spicy bean burrito, insanely spicy enchanted bean burrito, insanely spicy jumping bean burrito`
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
    print(`${detail.item} (${detail.quantity}) - ${detail.value}`, HIGHLIGHT);
  }

  set("garboResultsMeat", totalMeat);
  set("garboResultsItems", totalItems);

  message("This run of garbo", meat, items);
  message("So far today", totalMeat, totalItems);
}
