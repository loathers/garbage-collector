import {
  autosellPrice,
  Coinmaster,
  historicalAge,
  historicalPrice,
  Item,
  Monster,
  myClass,
  sellPrice,
  toInt,
} from "kolmafia";
import { $class, $item, $items, getSaleValue, sum } from "libram";

const garboRegularValueCache = new Map<Item, number>();

const garboHistoricalValueCache = new Map<Item, number>();

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
        garboValue($item`mushroom filet`),
      ),
  ],
  [
    $item`little firkin`,
    () =>
      garboAverageValue(
        ...$items`martini, screwdriver, strawberry daiquiri, margarita, vodka martini, tequila sunrise, bottle of Amontillado, barrel-aged martini, barrel gun`,
      ),
  ],
  [
    $item`normal barrel`,
    () =>
      garboAverageValue(
        ...$items`a little sump'm sump'm, pink pony, rockin' wagon, roll in the hay, slip 'n' slide, slap and tickle`,
      ),
  ],
  [
    $item`big tun`,
    () =>
      garboAverageValue(
        ...$items`gibson, gin and tonic, mimosette, tequila sunset, vodka and tonic, zmobie`,
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
        ...$items`spicy bean burrito, spicy enchanted bean burrito, spicy jumping bean burrito`,
      ),
  ],
  [
    $item`disintegrating barrel`,
    () =>
      garboAverageValue(
        ...$items`insanely spicy bean burrito, insanely spicy enchanted bean burrito, insanely spicy jumping bean burrito`,
      ),
  ],
  [
    $item`moist barrel`,
    () =>
      garboAverageValue(
        ...$items`cast, concentrated magicalness pill, enchanted barbell, giant moxie weed, Mountain Stream soda`,
      ),
  ],
  [
    $item`rotting barrel`,
    () =>
      garboAverageValue(
        ...$items`Doc Galaktik's Ailment Ointment, extra-strength strongness elixir, jug-o-magicalness, Marquis de Poivre soda, suntan lotion of moxiousness`,
      ),
  ],
  [
    $item`mouldering barrel`,
    () =>
      garboAverageValue(
        ...$items`creepy ginger ale, haunted battery, scroll of drastic healing, synthetic marrow, the funk`,
      ),
  ],
  [
    $item`barnacled barrel`,
    () =>
      garboAverageValue(
        ...$items`Alewife™ Ale, bazookafish bubble gum, beefy fish meat, eel battery, glistening fish meat, ink bladder, pufferfish spine, shark cartilage, slick fish meat, slug of rum, slug of shochu, slug of vodka, temporary teardrop tattoo`,
      ),
  ],
  [$item`fake hand`, () => 50000],
  [
    $item`psychoanalytic jar`,
    () =>
      // Exclude jick because he's rate-limited
      Math.max(
        ...$items`jar of psychoses (The Meatsmith), jar of psychoses (The Captain of the Gourd), jar of psychoses (The Crackpot Mystic), jar of psychoses (The Pretentious Artist), jar of psychoses (The Old Man), jar of psychoses (The Suspicious-Looking Guy)`.map(
          (jar) => garboValue(jar),
        ),
      ),
  ],
  [
    $item`warbear whosit`,
    () =>
      (0.35 *
        garboAverageValue(
          ...$items`warbear auto-anvil, warbear chemistry lab, warbear high-efficiency still, warbear induction oven, warbear jackhammer drill press, warbear LP-ROM burner, warbear energy bracers, warbear exhaust manifold, warbear exo-arm, warbear foil hat, warbear laser beacon, warbear oil pan`,
        ) +
        0.65 *
          garboAverageValue(
            ...$items`warbear metalworking primer, warbear beeping telegram, warbear gyrocopter, warbear procedural hilarity drone, warbear robo-camouflage unit, warbear sequential gaiety distribution system`,
          )) /
      100,
  ],
  ...$items`worthless gewgaw, worthless knick-knack, worthless trinket`.map(
    (i): [Item, () => number] => [
      i,
      currency(
        ...$items`seal tooth, chisel, petrified noodles, jabañero pepper, banjo strings, hot buttered roll, wooden figurine, ketchup, catsup, volleyball`,
        ...(myClass() === $class`Seal Clubber` ? $items`figurine of an ancient seal` : []),
      ),
    ],
  ),
  [$item`Boris's key`, () => garboValue($item`Boris's key lime`) - garboValue($item`lime`)],
  [$item`Jarlsberg's key`, () => garboValue($item`Jarlsberg's key lime`) - garboValue($item`lime`)],
  [
    $item`Sneaky Pete's key`,
    () => garboValue($item`Sneaky Pete's key lime`) - garboValue($item`lime`),
  ],
  [
    $item`fat loot token`,
    currency(
      ...$items`Boris's key, Jarlsberg's key, Sneaky Pete's key, Boris's ring, Jarlsberg's earring, Sneaky Pete's breath spray, potato sprout, sewing kit, Spellbook: Singer's Faithful Ocelot, Spellbook: Drescher's Annoying Noise, Spellbook: Walberg's Dim Bulb, dried gelatinous cube`,
    ),
  ],
]);

const exclusions = new Set([
  // For tradeable items which can be "consumed" infinitely
  $item`ChibiBuddy™ (off)`,
]);

function garboSaleValue(item: Item, useHistorical: boolean): number {
  if (useHistorical) {
    if (historicalAge(item) <= 7.0 && historicalPrice(item) > 0) {
      const isMallMin = historicalPrice(item) === Math.max(100, 2 * autosellPrice(item));
      return isMallMin ? autosellPrice(item) : 0.9 * historicalPrice(item);
    }
  }
  return getSaleValue(item);
}

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

let quick = false;
export function setHistoricalPriceDefault(val: boolean) {
  quick = val;
}

export function garboValue(item: Item, useHistorical = false): number {
  if (exclusions.has(item)) return 0;
  useHistorical ||= quick;
  const cachedValue =
    garboRegularValueCache.get(item) ??
    (useHistorical ? garboHistoricalValueCache.get(item) : undefined);
  if (cachedValue === undefined) {
    const specialValueCompute = specialValueLookup.get(item);
    const value = specialValueCompute?.() ?? garboSaleValue(item, useHistorical);
    (useHistorical ? garboHistoricalValueCache : garboRegularValueCache).set(item, value);
    return value;
  }
  return cachedValue;
}

export function garboAverageValue(...items: Item[]): number {
  return sum(items, garboValue) / items.length;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function bofaValue(_monster: Monster): number {
  return 0;
}
