import {
  autosellPrice,
  Coinmaster,
  Familiar,
  familiarEquipment,
  historicalAge,
  historicalPrice,
  Item,
  myClass,
  sellPrice,
  sellsItem,
  toInt,
} from "kolmafia";
import {
  $class,
  $item,
  $items,
  BurningLeaves,
  Delayed,
  getSaleValue,
  sum,
  undelay,
} from "libram";

type ItemQuantity = {
  item: Item;
  quantity: number;
};

export type ValueFunctions = {
  value: (item: Item | ItemQuantity, useHistorical?: boolean) => number;
  averageValue: (...items: (Item | ItemQuantity)[]) => number;
};

export function makeValue(
  options: { itemValues?: Map<Item, Delayed<number>> } = {},
): ValueFunctions {
  const regularValueCache = new Map<Item, number>();
  const historicalValueCache = new Map<Item, number>();
  const inputValues: [Item, () => number][] = options.itemValues
    ? [...options.itemValues.entries()].map(([item, val]) => [
        item,
        () => undelay(val),
      ])
    : [];
  const specialValueLookup = new Map<Item, () => number>([
    [
      $item`Freddy Kruegerand`,
      currency(
        ...$items`bottle of Bloodweiser, electric Kool-Aid, Dreadsylvanian skeleton key`,
      ),
    ],
    [$item`Beach Buck`, currency($item`one-day ticket to Spring Break Beach`)],
    [
      $item`Coinspiracy`,
      currency(...$items`Merc Core deployment orders, karma shawarma`),
    ],
    [$item`FunFunds™`, currency($item`one-day ticket to Dinseylandfill`)],
    [$item`Volcoino`, currency($item`one-day ticket to That 70s Volcano`)],
    [
      $item`Wal-Mart gift certificate`,
      currency($item`one-day ticket to The Glaciest`),
    ],
    [$item`cop dollar`, currency($item`shoe gum`)],
    [$item`Rubee™`, currency($item`FantasyRealm guest pass`)],
    [$item`Guzzlrbuck`, currency($item`Never Don't Stop Not Striving`)],
    ...complexCandy(),
    [
      $item`Merc Core deployment orders`,
      () => value($item`one-day ticket to Conspiracy Island`),
    ],
    [
      $item`free-range mushroom`,
      () =>
        3 *
        Math.max(
          value($item`mushroom tea`) - value($item`soda water`),
          value($item`mushroom whiskey`) - value($item`fermenting powder`),
          value($item`mushroom filet`),
        ),
    ],
    [
      $item`little firkin`,
      () =>
        averageValue(
          ...$items`martini, screwdriver, strawberry daiquiri, margarita, vodka martini, tequila sunrise, bottle of Amontillado, barrel-aged martini, barrel gun`,
        ),
    ],
    [
      $item`normal barrel`,
      () =>
        averageValue(
          ...$items`a little sump'm sump'm, pink pony, rockin' wagon, roll in the hay, slip 'n' slide, slap and tickle`,
        ),
    ],
    [
      $item`big tun`,
      () =>
        averageValue(
          ...$items`gibson, gin and tonic, mimosette, tequila sunset, vodka and tonic, zmobie`,
        ),
    ],
    [
      $item`weathered barrel`,
      () =>
        averageValue(
          ...$items`bean burrito, enchanted bean burrito, jumping bean burrito`,
        ),
    ],
    [
      $item`dusty barrel`,
      () =>
        averageValue(
          ...$items`spicy bean burrito, spicy enchanted bean burrito, spicy jumping bean burrito`,
        ),
    ],
    [
      $item`disintegrating barrel`,
      () =>
        averageValue(
          ...$items`insanely spicy bean burrito, insanely spicy enchanted bean burrito, insanely spicy jumping bean burrito`,
        ),
    ],
    [
      $item`moist barrel`,
      () =>
        averageValue(
          ...$items`cast, concentrated magicalness pill, enchanted barbell, giant moxie weed, Mountain Stream soda`,
        ),
    ],
    [
      $item`rotting barrel`,
      () =>
        averageValue(
          ...$items`Doc Galaktik's Ailment Ointment, extra-strength strongness elixir, jug-o-magicalness, Marquis de Poivre soda, suntan lotion of moxiousness`,
        ),
    ],
    [
      $item`mouldering barrel`,
      () =>
        averageValue(
          ...$items`creepy ginger ale, haunted battery, scroll of drastic healing, synthetic marrow, the funk`,
        ),
    ],
    [
      $item`barnacled barrel`,
      () =>
        averageValue(
          ...$items`Alewife™ Ale, bazookafish bubble gum, beefy fish meat, eel battery, glistening fish meat, ink bladder, pufferfish spine, shark cartilage, slick fish meat, slug of rum, slug of shochu, slug of vodka, temporary teardrop tattoo`,
        ),
    ],
    [
      $item`psychoanalytic jar`,
      () =>
        // Exclude jick because he's rate-limited
        Math.max(
          ...$items`jar of psychoses (The Meatsmith), jar of psychoses (The Captain of the Gourd), jar of psychoses (The Crackpot Mystic), jar of psychoses (The Pretentious Artist), jar of psychoses (The Old Man), jar of psychoses (The Suspicious-Looking Guy)`.map(
            (jar) => value(jar),
          ),
        ),
    ],
    [
      $item`warbear whosit`,
      () =>
        (0.35 *
          averageValue(
            ...$items`warbear auto-anvil, warbear chemistry lab, warbear high-efficiency still, warbear induction oven, warbear jackhammer drill press, warbear LP-ROM burner, warbear energy bracers, warbear exhaust manifold, warbear exo-arm, warbear foil hat, warbear laser beacon, warbear oil pan`,
          ) +
          0.65 *
            averageValue(
              ...$items`warbear metalworking primer, warbear beeping telegram, warbear gyrocopter, warbear procedural hilarity drone, warbear robo-camouflage unit, warbear sequential gaiety distribution system`,
            )) /
        100,
    ],
    ...$items`worthless gewgaw, worthless knick-knack, worthless trinket`.map(
      (i): [Item, () => number] => [
        i,
        currency(
          ...$items`seal tooth, chisel, petrified noodles, jabañero pepper, banjo strings, hot buttered roll, wooden figurine, ketchup, catsup, volleyball`,
          ...(myClass() === $class`Seal Clubber`
            ? $items`figurine of an ancient seal`
            : []),
        ),
      ],
    ),
    [
      $item`Boris's key`,
      () => value($item`Boris's key lime`) - value($item`lime`),
    ],
    [
      $item`Jarlsberg's key`,
      () => value($item`Jarlsberg's key lime`) - value($item`lime`),
    ],
    [
      $item`Sneaky Pete's key`,
      () => value($item`Sneaky Pete's key lime`) - value($item`lime`),
    ],
    [
      $item`fat loot token`,
      currency(
        ...$items`Boris's key, Jarlsberg's key, Sneaky Pete's key, Boris's ring, Jarlsberg's earring, Sneaky Pete's breath spray, potato sprout, sewing kit, Spellbook: Singer's Faithful Ocelot, Spellbook: Drescher's Annoying Noise, Spellbook: Walberg's Dim Bulb, dried gelatinous cube`,
      ),
    ],
    [$item`inflammable leaf`, inflammableLeafCurrency()],
    [$item`envelope full of Meat`, () => 50_000],
    [
      $item`crystalline cheer`,
      currency(
        ...$items`stale cheer wine, stale Cheer-E-Os, Cheer-Up soda, cheer-o-gram, cheerful antler hat, cheerful Crimbo sweater, cheerful pajama pants`,
        // ignore the science volumes because some accounts can't acquire them
      ),
    ],
    [$item`knucklebone`, () => value($item`tiny plastic sword`) / 2927],
    ...Familiar.all()
      .map((f) => familiarEquipment(f))
      .filter((i) => i !== $item.none && i.tradeable && i.discardable)
      .map(
        (i) =>
          [
            i,
            () =>
              Math.min(
                saleValue(i, false),
                value($item`box of Familiar Jacks`),
              ),
          ] as const,
      ),
    ...inputValues,
  ]);

  const exclusions = new Set([
    // For tradeable items which can be "consumed" infinitely
    $item`ChibiBuddy™ (off)`,
  ]);

  function saleValue(item: Item, useHistorical: boolean): number {
    if (useHistorical) {
      if (historicalAge(item) <= 7.0 && historicalPrice(item) > 0) {
        const isMallMin =
          historicalPrice(item) === Math.max(100, 2 * autosellPrice(item));
        return isMallMin ? autosellPrice(item) : 0.9 * historicalPrice(item);
      }
    }
    return getSaleValue(item);
  }

  function currency(...items: Item[]): () => number {
    const unitCost: [Item, number][] = items.map((i) => {
      const coinmaster = Coinmaster.all().find((c) => sellsItem(c, i));
      if (!coinmaster) {
        return [i, Infinity];
      } else {
        return [i, sellPrice(coinmaster, i) || Infinity];
      }
    });
    return () =>
      Math.max(...unitCost.map(([item, cost]) => value(item) / cost));
  }

  function inflammableLeafCurrency(): () => number {
    if (!BurningLeaves.have()) return () => 0;
    const ignored = $items`lit leaf lasso, day shortener`; // Ignore limited purchases
    const unitCost = [...BurningLeaves.burnFor].filter(
      (entry): entry is [Item, number] =>
        entry[0] instanceof Item &&
        entry[0].tradeable &&
        !ignored.includes(entry[0]),
    );
    return () =>
      Math.max(...unitCost.map(([item, cost]) => value(item) / cost));
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
      .map((i) => [
        i,
        () => Math.min(...candyLookup[toInt(i) % 5].map((i) => value(i))),
      ]);
    return candyIdPrices;
  }

  function value(
    inputItem: Item | ItemQuantity,
    useHistorical = false,
  ): number {
    const { item, quantity } =
      inputItem instanceof Item ? { item: inputItem, quantity: 1 } : inputItem;
    if (exclusions.has(item)) return 0;
    const cachedValue =
      regularValueCache.get(item) ??
      (useHistorical ? historicalValueCache.get(item) : undefined);
    if (cachedValue === undefined) {
      const specialValueCompute = specialValueLookup.get(item);
      const value = specialValueCompute?.() ?? saleValue(item, useHistorical);
      (useHistorical ? historicalValueCache : regularValueCache).set(
        item,
        value,
      );
      return value;
    }
    return quantity * cachedValue;
  }

  function averageValue(...items: (Item | ItemQuantity)[]): number {
    return sum(items, value) / items.length;
  }

  return {
    averageValue,
    value,
  };
}
