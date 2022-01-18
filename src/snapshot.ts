import {
  bufferToFile,
  fileToBuffer,
  mySessionItems,
  mySessionMeat,
  print,
  sellPrice,
  toInt,
  toItem,
} from "kolmafia";
import { $item, $items, getFoldGroup, getSaleValue, property, set, sumNumbers } from "libram";
import { fmt, HIGHLIGHT, resetDailyPreference } from "./lib";

/**
 * Return a mapping of the session items, mapping foldable items to a single of their forms
 * @returns the item session results, with foldables mapped to a single of their folding forms
 */
function mySessionItemsWrapper(): Map<Item, number> {
  const foldableMapping = (item: Item): [Item, Item][] =>
    getFoldGroup(item).map((target: Item) => [target, item]);

  const foldables = new Map<Item, Item>([
    ...foldableMapping($item`liar's pants`),
    ...foldableMapping($item`ice pick`),
    ...foldableMapping($item`Spooky Putty sheet`),
    [$item`Spooky Putty monster`, $item`Spooky Putty sheet`],
    ...foldableMapping($item`stinky cheese sword`),
    ...foldableMapping($item`naughty paper shuriken`),
    ...foldableMapping($item`Loathing Legion knife`),
    ...foldableMapping($item`deceased crimbo tree`),
    ...foldableMapping($item`makeshift turban`),
    ...foldableMapping($item`turtle wax shield`),
    ...foldableMapping($item`metallic foil bow`),
    ...foldableMapping($item`ironic moustache`),
    ...foldableMapping($item`bugged balaclava`),
    ...foldableMapping($item`toggle switch (Bartend)`),
    ...foldableMapping($item`mushroom cap`),
    [$item`empty Rain-Doh can`, $item`can of Rain-Doh`],
  ]);

  const inventory = new Map<Item, number>();
  for (const [itemStr, quantity] of Object.entries(mySessionItems())) {
    const item = toItem(itemStr);
    const foldableItem = foldables.get(item) ?? item;
    const alreadyInventory = inventory.get(item);
    if (alreadyInventory !== undefined) {
      inventory.set(foldableItem, quantity + alreadyInventory);
    } else {
      inventory.set(foldableItem, quantity);
    }
  }
  return inventory;
}

/**
 * Performa a binary element-wise operation on two inventories
 * @param a The LHS inventory to perform the operation on
 * @param b The RHS inventory to perform the operation on
 * @param op a function to compute between the sets
 * @param transitive if true use the value of b for any items not in a. if false, ignore values not in a
 * @returns a new map representing the combined inventories
 */
function inventoryOperation(
  a: Map<Item, number>,
  b: Map<Item, number>,
  op: (aPart: number, bPart: number) => number,
  transitive: boolean
): Map<Item, number> {
  // return every entry that is in a and not in b
  const difference = new Map<Item, number>();

  for (const [item, quantity] of a.entries()) {
    const combinedQuantity = op(quantity, b.get(item) ?? 0);
    difference.set(item, combinedQuantity);
  }
  if (transitive) {
    for (const [item, quantity] of b.entries()) {
      if (!a.has(item)) {
        difference.set(item, quantity);
      }
    }
  }
  const diffEntries: [Item, number][] = [...difference.entries()];

  return new Map<Item, number>(diffEntries.filter((value) => value[1] !== 0));
}

/**
 * An entry showing the value of each Item in a snapshot
 * @member item the item associated with this detail
 * @member value the numeric value of the full quantity of items (to get value of each item, do value / quantity) (can be negative)
 * @member quantity the number of items for this detail
 */
interface ItemDetail {
  item: Item;
  value: number;
  quantity: number;
}

/**
 * The full value (in meat) results of a Snapshot
 * @member meat the value of this snapshot in pure meat
 * @member items the value of the items in this snapshot in meat
 * @member total sum of meat and items
 * @member itemDetails a list of the detailed accounting for each item in this snapshot
 */
interface ItemResult {
  meat: number;
  items: number;
  total: number;
  itemDetails: ItemDetail[];
}

/**
 * A wrapper around tracking items and meat gained from this session
 * Smartly handles foldables being added/removed based on their state
 * Provides operations to add sessions and subtract Snapshots so you can isolate the value of each snapshot using a baseline
 * @member meat the raw meat associated with this snapshot
 * @member items a map representing the items gained/lost during this snapshot
 */
export class Snapshot {
  meat: number;
  items: Map<Item, number>;
  /**
   * Construct a new snapshot
   * @param meat the amount of meat associated with this snapshot
   * @param items the items associated with this snapshot
   */
  private constructor(meat: number, items: Map<Item, number>) {
    this.meat = meat;
    this.items = items;
  }

  /**
   * Value this snapshot
   * @param itemValue a function that, when given an item, will give a meat value of the item
   * @returns ItemResult with the full value of this snapshot given the input function
   */
  value(itemValue: (item: Item) => number): ItemResult {
    // TODO: add garbo specific pricing (sugar equipment for synth, etc.)

    const meat = Math.floor(this.meat);
    const itemDetails = [...this.items.entries()].map(([item, quantity]) => {
      return { item, quantity, value: itemValue(item) * quantity };
    });
    const items = Math.floor(sumNumbers(itemDetails.map((detail) => detail.value)));

    return { meat, items, total: meat + items, itemDetails };
  }

  /**
   * Subtract the contents of another snapshot from this one, removing any items that have a resulting quantity of 0
   *  (this will ignore elements in b but not in a)
   * @param other the snapshot from which to pull values to remove from this snapshot
   * @returns a new snapshot representing the difference between this snapshot and the other snapshot
   */
  diff(other: Snapshot): Snapshot {
    return new Snapshot(
      this.meat - other.meat,
      inventoryOperation(this.items, other.items, (a: number, b: number) => a - b, false)
    );
  }
  /**
   * Subtract the contents of snasphot b from snapshot a, removing any items that have a resulting quantity of 0
   *  (this will ignore elements in b but not in a)
   * @param a the snapshot from which to subtract elements
   * @param b the snapshot from which to add elements
   * @returns a new snapshot representing the difference between a and b
   */
  static diff(a: Snapshot, b: Snapshot): Snapshot {
    return a.diff(b);
  }

  /**
   * Generate a new Snapshot combining multiple snapshots together
   * @param other the snapshot from which to add elements to this set
   * @returns a new snapshot representing the addition of other to this
   */
  add(other: Snapshot): Snapshot {
    return new Snapshot(
      this.meat + other.meat,
      inventoryOperation(this.items, other.items, (a: number, b: number) => a + b, true)
    );
  }

  /**
   * Combine the contents of snapshots
   * @param snapshots the set of snapshots to combine together
   * @returns a new snapshot representing the difference between a and b
   */
  static add(...snapshots: Snapshot[]): Snapshot {
    return snapshots.reduce((previousSnapshot, currentSnapshot) =>
      previousSnapshot.add(currentSnapshot)
    );
  }

  /**
   * Export this snapshot to a file in the data/ directory. Conventionally this file should end in ".json"
   * @param filename The file into which to export
   */
  toFile(filename: string): void {
    const val = {
      meat: this.meat,
      items: Object.fromEntries(this.items),
    };
    bufferToFile(JSON.stringify(val), filename);
  }

  /**
   * Import a snapshot from a file in the data/ directory. Conventionally the file should end in ".json"
   * @param filename The file from which to import
   * @returns the Snapshot represented by the file
   */
  static fromFile(filename: string): Snapshot {
    const val: { meat: number; items: { [item: string]: number } } = JSON.parse(
      fileToBuffer(filename)
    );

    const parsedItems: [Item, number][] = Object.entries(val.items).map(([itemStr, quantity]) => [
      toItem(itemStr),
      quantity,
    ]);
    return new Snapshot(val.meat, new Map<Item, number>(parsedItems));
  }

  static current(): Snapshot {
    return new Snapshot(mySessionMeat(), mySessionItemsWrapper());
  }
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

function printSnapshot(snapshot: Snapshot): void {
  const value = snapshot.value(garboValue);
  const printProfit = (details: ItemDetail[]) => {
    for (const { item, quantity, value } of details) {
      print(`  ${item} (${quantity}) @ ${Math.floor(value)}`);
    }
  };
  const lowValue = value.itemDetails.filter((detail) => detail.value < 0);
  const highValue = value.itemDetails.filter((detail) => detail.value > 0);

  print(`Total Snapshot Value: ${value.total}`);
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

let snapshot: Snapshot | null = null;
export function startSnapshot(): void {
  snapshot = Snapshot.current();
}

export function snapshotSinceStart(): Snapshot {
  if (snapshot) {
    return Snapshot.current().diff(snapshot);
  }
  return Snapshot.current();
}

const debug = false;
export function printGarboSnapshot(): void {
  if (debug) {
    printSnapshot(snapshotSinceStart());
  }
  if (resetDailyPreference("garboResultsDate")) {
    set("garboResultsMeat", 0);
    set("garboResultsItems", 0);
  }
  const message = (head: string, m: number, i: number) =>
    print(
      `${head}, you generated ${fmt(m + i)} meat, with ${fmt(m)} raw meat and ${fmt(i)} from items`,
      HIGHLIGHT
    );

  const { meat, items } = snapshotSinceStart().value(garboValue);
  const totalMeat = meat + property.getNumber("garboResultsMeat", 0);
  const totalItems = items + property.getNumber("garboResultsItems", 0);

  set("garboResultsMeat", meat);
  set("garboResultsMeat", items);

  message("This run of garbo", meat, items);
  message("So far today", totalMeat, totalItems);
}
