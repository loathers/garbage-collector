import {
  availableAmount,
  buy,
  chew,
  cliExecute,
  drink,
  eat,
  Effect,
  Element,
  elementalResistance,
  fullnessLimit,
  getClanLounge,
  handlingChoice,
  haveEffect,
  inebrietyLimit,
  Item,
  itemAmount,
  itemType,
  lastChoice,
  logprint,
  mallPrice,
  mpCost,
  myClass,
  myFullness,
  myInebriety,
  myLevel,
  myMaxhp,
  mySpleenUse,
  myThrall,
  print,
  putCloset,
  retrieveItem,
  runChoice,
  sellsItem,
  setProperty,
  spleenLimit,
  takeCloset,
  toItem,
  toSkill,
  turnsPerCast,
  use,
  useSkill,
} from "kolmafia";
import {
  $class,
  $coinmaster,
  $effect,
  $effects,
  $element,
  $item,
  $items,
  $skill,
  $thrall,
  canRememberSong,
  Diet,
  get,
  getActiveSongs,
  getAverageAdventures,
  getSongCount,
  getSongLimit,
  have,
  maxBy,
  maximizeCached,
  MayoClinic,
  MenuItem,
  PrismaticBeret,
  realmAvailable,
  sum,
  uneffect,
  withChoice,
  withProperties,
  withProperty,
} from "libram";
import { acquire } from "../acquire";
import { globalOptions } from "../config";
import { synthesize } from "../resources/synthesis";
import { effectValueWithOpportunityCost } from "../potions";
import { estimatedGarboTurns, highMeatMonsterCount } from "../turns";
import { garboValue } from "../garboValue";
import { FarmingStrategy } from "../farmingStrategy";
import {
  availableFromMoonZoneRestaurant,
  existingNoodleCharges,
  frostyMug,
  isNoodleTier,
  LEGENDARY_DIGESTION_CHOICE_ID,
  LEGENDARY_DIGESTION_STOMACH,
  legendaryNoodleDishes,
  Mayo,
  MPA,
  Note,
  Organ,
  saladFork,
  spleenCleaners,
  stomachLiverCleaners,
  useIfUnused,
} from "./lib";
import { countCopies, ingredientCost } from "./menu";

function consumeWhileRespectingMoonRestaurant(command: () => void, item: Item) {
  const usingMoonZoneRestaurant = availableFromMoonZoneRestaurant(item);
  withProperties(
    {
      autoSatisfyWithCloset:
        !usingMoonZoneRestaurant && get("autoSatisfyWithCloset"),
      autoSatisfyWithMall: false,
    },
    command,
  );
}

function eatSafe(qty: number, item: Item) {
  if (
    have($item`Universal Seasoning`) &&
    $item`Universal Seasoning`.dailyusesleft > 0 &&
    !get("universalSeasoningActive")
  ) {
    use($item`Universal Seasoning`);
  }
  if (
    myLevel() >= 15 &&
    !get("_hungerSauceUsed") &&
    mallPrice($item`Hunger™ Sauce`) < 3 * MPA
  ) {
    acquire(1, $item`Hunger™ Sauce`, 3 * MPA);
    use($item`Hunger™ Sauce`);
  }
  // can't use fudge spork with legendary pasta
  if (
    itemType(item) === "food" &&
    !legendaryNoodleDishes.includes(item) &&
    mallPrice($item`fudge spork`) < 3 * MPA &&
    !get("_fudgeSporkUsed")
  ) {
    eat($item`fudge spork`);
  }
  if (
    myClass() === $class`Pastamancer` &&
    myThrall() !== $thrall`Spice Ghost` &&
    !get("_legendarySpiceGhostFood") &&
    $thrall`Spice Ghost`.level + (get("pumpkinSpiceWhorlUsed") ? 3 : 0) >= 11
  ) {
    useSkill($skill`Bind Spice Ghost`);
  }
  useIfUnused($item`milk of magnesium`, "_milkOfMagnesiumUsed", 5 * MPA);
  consumeWhileRespectingMoonRestaurant(() => {
    if (!eat(qty, item)) throw "Failed to eat safely";
  }, item);
}

const EXPENSIVE_SONGS = FarmingStrategy.isUnderwater()
  ? $effects`The Ballad of Richie Thingfinder, Chorale of Companionship, Donho's Bubbly Ballad`
  : $effects`The Ballad of Richie Thingfinder, Chorale of Companionship`;

const USEFUL_SONGS = $effects`Polka of Plenty, Ur-Kel's Aria of Annoyance, Fat Leon's Phat Loot Lyric`;

function shrugForOde() {
  const inexpensiveSongs = getActiveSongs().filter(
    (e) => !EXPENSIVE_SONGS.includes(e),
  );
  const uselessSongs = inexpensiveSongs.filter(
    (e) => !USEFUL_SONGS.includes(e),
  );
  if (uselessSongs.length >= 1) return uneffect(uselessSongs[0]);
  if (inexpensiveSongs.length === 1) return uneffect(inexpensiveSongs[0]);
  return uneffect(
    maxBy(inexpensiveSongs, (e) => haveEffect(e) * mpCost(toSkill(e)), true),
  );
}

function buskEffectValuer(effect: Effect, duration: number): number {
  if (effect === $effect`Salty Mouth`) return 5 * get("valueOfAdventure");
  if (
    effect === $effect`Hammertime` &&
    !have($effect`Hammertime`) &&
    get("_beretBuskingUses") === 0
  ) {
    return 1_000; // Arbitrary value, assume it will give upcoming busks more value if it's our first busk
  }
  return effectValueWithOpportunityCost(effect, duration);
}

function canBusk() {
  return PrismaticBeret.have() && get("_beretBuskingUses") < 5;
}

function buskForSaltyMouth() {
  if (!canBusk()) return;
  for (let i = get("_beretBuskingUses"); i < 5; i++) {
    if (have($effect`Salty Mouth`)) break;
    PrismaticBeret.buskFor(buskEffectValuer, {});
  }
}

function drinkSafe(qty: number, item: Item) {
  const prevDrunk = myInebriety();
  if (have($skill`The Ode to Booze`)) {
    if (!have($effect`Ode to Booze`) && getSongCount() >= getSongLimit()) {
      shrugForOde();
    }
    const odeTurns = qty * item.inebriety;
    const castTurns = odeTurns - haveEffect($effect`Ode to Booze`);
    if (castTurns > 0) {
      if (!canRememberSong() && !have($effect`Ode to Booze`)) {
        throw new Error("Unable to make a song slot for Ode to Booze!");
      }
      useSkill(
        $skill`The Ode to Booze`,
        Math.ceil(castTurns / turnsPerCast($skill`The Ode to Booze`)),
      );
    }
  }
  consumeWhileRespectingMoonRestaurant(() => {
    if (item.notes?.includes("BEER") && canBusk()) {
      for (let i = 0; i < qty; i++) {
        buskForSaltyMouth();
        if (!drink(1, item)) throw "Failed to drink safely";
      }
    } else if (!drink(qty, item)) throw "Failed to drink safely";
  }, item);

  if (item.inebriety === 1 && prevDrunk === qty + myInebriety() - 1) {
    // sometimes mafia does not track the mime army shotglass property
    setProperty("_mimeArmyShotglassUsed", "true");
  }
}

function chewSafe(qty: number, item: Item) {
  withProperty("autoSatisfyWithMall", false, () => {
    if (!chew(qty, item)) throw "Failed to chew safely";
  });
}

function consumeSafe(
  qty: number,
  item: Item,
  additionalValue?: number,
  skipAcquire?: boolean,
) {
  const spleenCleaned = spleenCleaners.get(item);
  if (spleenCleaned && mySpleenUse() < spleenCleaned) {
    throw "No spleen to clear with this.";
  }
  const averageAdventures = getAverageAdventures(item);
  const usingMoonZoneRestaurant = availableFromMoonZoneRestaurant(item);
  if (!skipAcquire && !usingMoonZoneRestaurant) {
    if (averageAdventures > 0 || additionalValue) {
      const cap = Math.max(0, averageAdventures * MPA) + (additionalValue ?? 0);
      acquire(qty, item, cap, true, undefined, true);
    } else {
      acquire(qty, item);
    }
  }
  // When eating the daily special, we need to closet any excess food, since it's much cheaper to eat the special
  const excessAmount = usingMoonZoneRestaurant ? itemAmount(item) : 0;
  if (usingMoonZoneRestaurant && itemAmount(item) > 0) {
    putCloset(item, excessAmount);
  }
  if (itemType(item) === "food" || item === saladFork) {
    eatSafe(qty, item);
    if (excessAmount > 0) takeCloset(item, excessAmount);
    return;
  }
  if (itemType(item) === "booze" || item === frostyMug) {
    drinkSafe(qty, item);
    if (excessAmount > 0) takeCloset(item, excessAmount);
    return;
  }
  if (itemType(item) === "spleen item") {
    chewSafe(qty, item);
    return;
  }
  use(qty, item);
}

type DietName = "FULL" | "SHOTGLASS" | "PANTSGIVING" | "SWEATPANTS";

export function printDiet(diet: Diet<Note>, name: DietName) {
  print(`===== ${name} DIET =====`);
  if (diet.entries.length === 0) return;
  diet = diet.copy();
  const noodleDoubling = usesNoodleDoubling(diet);
  diet.entries.sort(
    (a, b) =>
      itemPriority(b.menuItems, noodleDoubling) -
      itemPriority(a.menuItems, noodleDoubling),
  );

  const targets = Math.floor(highMeatMonsterCount() + countCopies(diet));
  const adventures = Math.floor(
    estimatedGarboTurns(false) + diet.expectedAdventures(),
  );
  print(
    `Planning to fight ${targets} ${globalOptions.target} and run ${adventures} adventures`,
  );

  for (const dietEntry of diet.entries) {
    if (dietEntry.quantity === 0) continue;
    const target = dietEntry.target();
    const datastr = target.data ? `(${target.data})` : "";
    const maxstr = target.maximum ? ` (max ${target.maximum})` : "";
    const helpersstr =
      dietEntry.helpers().length > 0
        ? ` helpers: ${dietEntry.helpers().join(", ")}`
        : "";
    const addvalstr = target.additionalValue
      ? ` (additional value: ${target.additionalValue})`
      : "";
    const valuestr = `value: ${Math.floor(
      dietEntry.expectedValue(MPA, diet),
    )}${addvalstr} price: ${Math.floor(dietEntry.expectedPrice())}`;
    print(
      `${dietEntry.quantity}${maxstr} ${target}${datastr}${helpersstr} ${valuestr}`,
    );
  }
  const totalValue = diet.expectedValue(MPA);
  const totalCost = diet.expectedPrice();
  const netValue = totalValue - totalCost;
  print(
    `Assuming MPA of ${MPA}, Total Cost ${totalCost}, Total Value ${totalValue}, Net Value ${netValue}`,
  );
}

function usesNoodleDoubling(diet: Diet<Note>): boolean {
  return (
    existingNoodleCharges() > 0 ||
    diet.entries.some(
      ({ menuItems, quantity }) =>
        quantity > 0 &&
        menuItems.some((menuItem) =>
          legendaryNoodleDishes.includes(menuItem.item),
        ),
    )
  );
}

// Item priority - higher means we eat it first.
// Anything that gives a consumption buff should go first (e.g. Refined Palate).
// With Legendary Digestion charges, use existing charges, then eat noodle dishes,
// then food potions, so the charges double the potions rather than other food.
function itemPriority(
  menuItems: MenuItem<Note>[] | readonly MenuItem<Note>[],
  noodleDoubling = false,
) {
  // Last menu item is the food itself.
  const menuItem = menuItems[menuItems.length - 1];
  if (menuItem === undefined) {
    throw "Shouldn't have an empty menu item.";
  }
  if (menuItem.item === $item`spaghetti breakfast`) return 200;
  if (noodleDoubling) {
    if (isNoodleTier(menuItem.data)) return 170;
    if (legendaryNoodleDishes.includes(menuItem.item)) return 160;
    if (menuItem.data && menuItem.itemType() === "food") return 150;
  }
  if (
    $items`pocket wish, toasted brie`.includes(menuItem.item) ||
    spleenCleaners.get(menuItem.item) ||
    stomachLiverCleaners.get(menuItem.item)
  ) {
    return 100;
  } else {
    return 0;
  }
}

/**
 * A representation of a single diet step (eating, drinking, using, etc.)
 */
interface DietTask {
  name: string;
  perform(): void;
}

type ItemAction = (countToConsume: number, menuItem: MenuItem<Note>) => void;

const consumeAction: ItemAction = (countToConsume, menuItem) =>
  consumeSafe(countToConsume, menuItem.item, menuItem.additionalValue);

const elementalResistAction =
  (element: Element): ItemAction =>
  (countToConsume, menuItem) => {
    if (myMaxhp() < 1000 * (1 - elementalResistance(element) / 100)) {
      maximizeCached(["0.05 HP", `${element} Resistance`]);
      if (myMaxhp() < 1000 * (1 - elementalResistance(element) / 100)) {
        throw `Could not achieve enough ${element} resistance for ${menuItem.item}.`;
      }
    }
    consumeSafe(countToConsume, menuItem.item);
  };

/**
 * Menu items that need something other than `consumeAction`.
 */
function specialItemActions(): Map<Item, ItemAction> {
  const speakeasyDrinks = Object.keys(getClanLounge())
    .map((s) => toItem(s))
    .filter((i) => i.inebriety > 0);
  return new Map<Item, ItemAction>([
    [saladFork, elementalResistAction($element`hot`)],
    [frostyMug, elementalResistAction($element`cold`)],
    [
      $item`pocket wish`,
      (countToConsume, menuItem) => {
        if (acquire(countToConsume, $item`pocket wish`, 60000)) {
          cliExecute(`genie effect ${menuItem.effect}`);
        }
      },
    ],
    [
      $item`campfire hot dog`,
      (countToConsume, menuItem) => {
        // mafia does not support retrieveItem on campfire hot dog because it does not work on stick of firewood
        if (!have($item`stick of firewood`)) {
          buy(
            1,
            $item`stick of firewood`,
            ingredientCost($item`stick of firewood`),
          );
        }
        consumeSafe(countToConsume, menuItem.item);
      },
    ],
    // Special Seasoning is acquired by its own task and used automatically
    [$item`Special Seasoning`, () => {}],
    [
      $item`mini kiwi aioli`,
      (countToConsume, menuItem) => {
        retrieveItem(menuItem.item, countToConsume);
        use(menuItem.item);
      },
    ],
    [
      $item`Rethinking Candy`,
      (countToConsume, menuItem) => {
        synthesize(
          countToConsume,
          menuItem.effect ?? $effect`Synthesis: Greed`,
        );
      },
    ],
    ...Object.values(Mayo).map((mayo): [Item, ItemAction] => [
      mayo,
      (countToConsume, menuItem) =>
        MayoClinic.setMayoMinder(menuItem.item, countToConsume),
    ]),
    ...speakeasyDrinks.map((drink): [Item, ItemAction] => [
      drink,
      (countToConsume, menuItem) => {
        cliExecute(`drink ${countToConsume} ${menuItem.item}`);
      },
    ]),
    [
      $item`broberry brogurt`,
      (countToConsume, menuItem) => {
        const amountNeeded =
          countToConsume - availableAmount($item`broberry brogurt`);
        if (amountNeeded > 0) {
          const coinmasterPrice =
            realmAvailable("sleaze") &&
            sellsItem(
              $coinmaster`The Frozen Brogurt Stand`,
              $item`broberry brogurt`,
            )
              ? 10 * garboValue($item`Beach Buck`)
              : Infinity;
          const regularPrice = mallPrice($item`broberry brogurt`);
          if (coinmasterPrice < regularPrice) {
            const amountToBuy = Math.min(
              amountNeeded,
              Math.floor(itemAmount($item`Beach Buck`)),
            );
            buy(
              $coinmaster`The Frozen Brogurt Stand`,
              amountToBuy,
              $item`broberry brogurt`,
            );
          }
          buy(
            countToConsume - availableAmount($item`broberry brogurt`),
            $item`broberry brogurt`,
          );
        }
        consumeSafe(countToConsume, menuItem.item, menuItem.additionalValue);
      },
    ],
    [
      $item`designer sweatpants`,
      (countToConsume) => {
        for (let n = 1; n <= countToConsume; n++) {
          useSkill($skill`Sweat Out Some Booze`);
        }
      },
    ],
    [
      $item`august scepter`,
      () => useSkill($skill`Aug. 16th: Roller Coaster Day!`),
    ],
    ...legendaryNoodleDishes.map((dish): [Item, ItemAction] => [
      dish,
      (countToConsume, menuItem) => {
        // One at a time, since each leads to Legendary Digestion
        for (let i = 0; i < countToConsume; i++) {
          withChoice(
            LEGENDARY_DIGESTION_CHOICE_ID,
            LEGENDARY_DIGESTION_STOMACH,
            () => consumeSafe(1, menuItem.item, menuItem.additionalValue),
          );
          if (
            handlingChoice() &&
            lastChoice() === LEGENDARY_DIGESTION_CHOICE_ID
          ) {
            runChoice(LEGENDARY_DIGESTION_STOMACH);
          }
        }
      },
    ]),
  ]);
}

function acquireSeasoningTask(diet: Diet<Note>): DietTask {
  const seasoningCount = sum(diet.entries, ({ menuItems, quantity }) =>
    menuItems.some((menuItem) => menuItem.item === $item`Special Seasoning`)
      ? quantity
      : 0,
  );
  return {
    name: `Acquire ${seasoningCount} Special Seasoning`,
    perform: () => acquire(seasoningCount, $item`Special Seasoning`, MPA),
  };
}

type OrganAmounts = Record<Organ, number>;

const ORGANS: Organ[] = ["food", "booze", "spleen item"];

const noOrgans = (): OrganAmounts => ({ food: 0, booze: 0, "spleen item": 0 });

/**
 * Determine the total organ-filling and organ-cleansing of a given item.
 * We only ever want to eat a cleanser if it can actually cleanse, so we need
 * to sequence our diet using this information.
 */
function organEffects(menuItems: readonly MenuItem<Note>[]): {
  fills: OrganAmounts;
  cleans: OrganAmounts;
} {
  const fills = noOrgans();
  const cleans = noOrgans();
  for (const menuItem of menuItems) {
    const cleaning = stomachLiverCleaners.get(menuItem.item);
    const spleenCleaned = spleenCleaners.get(menuItem.item);
    if (cleaning) {
      const [fullness, inebriety] = cleaning;
      if (fullness < 0) cleans.food -= fullness;
      else fills.food += fullness;
      if (inebriety < 0) cleans.booze -= inebriety;
      else fills.booze += inebriety;
    } else if (
      menuItem.organ &&
      !(spleenCleaned && menuItem.organ === "spleen item")
    ) {
      fills[menuItem.organ] += menuItem.size;
    }
    if (spleenCleaned) cleans["spleen item"] += spleenCleaned;
  }
  return { fills, cleans };
}

/**
 * Creates a `DietTask` for a given `DietEntry` and `countToConsume`.
 */
function dietEntryTask(
  dietEntry: Diet<Note>["entries"][number],
  countToConsume: number,
  actions: Map<Item, ItemAction>,
): DietTask {
  const steps = dietEntry.menuItems.map((menuItem) => ({
    menuItem,
    action: actions.get(menuItem.item) ?? consumeAction,
  }));
  return {
    name: `${countToConsume} ${dietEntry.target()}`,
    perform: () => {
      for (const { menuItem, action } of steps) {
        action(countToConsume, menuItem);
      }
    },
  };
}

/**
 * Transform a diet into an array of diet tasks that can be carried out in order.
 * For example, cleansers are sequenced after there is filled organ space for them to clear.
 * Throws before anything is consumed if there is no order that fits.
 */
function dietTasks(diet: Diet<Note>): DietTask[] {
  const actions = specialItemActions();
  const tasks = [acquireSeasoningTask(diet)];

  const used: OrganAmounts = {
    food: myFullness(),
    booze: myInebriety(),
    "spleen item": mySpleenUse(),
  };
  const capacity: OrganAmounts = {
    food: fullnessLimit(),
    booze: inebrietyLimit(),
    "spleen item": spleenLimit(),
  };
  let shotglassAvailable =
    !get("_mimeArmyShotglassUsed") && have($item`mime army shotglass`);

  const noodleDoubling = usesNoodleDoubling(diet);
  const pending = [...diet.entries]
    .sort(
      (a, b) =>
        itemPriority(b.menuItems, noodleDoubling) -
        itemPriority(a.menuItems, noodleDoubling),
    )
    .map((dietEntry) => ({
      dietEntry,
      remaining: dietEntry.quantity,
      ...organEffects(dietEntry.menuItems),
    }));

  // How many of an entry we can consume right now, and whether the first one goes in the shotglass
  const fit = (entry: (typeof pending)[number]) => {
    const { fills, cleans } = entry;
    const usesShotglass =
      shotglassAvailable &&
      entry.dietEntry.menuItems.some(
        (menuItem) => menuItem.organ === "booze" && menuItem.size === 1,
      );
    const fill = (organ: Organ) =>
      usesShotglass && organ === "booze" ? 0 : fills[organ];
    let count = usesShotglass ? 1 : entry.remaining;
    for (const organ of ORGANS) {
      if (fill(organ) > 0) {
        count = Math.min(
          count,
          Math.floor((capacity[organ] - used[organ]) / fill(organ)),
        );
      }
      if (cleans[organ] > 0) {
        count = Math.min(count, Math.floor(used[organ] / cleans[organ]));
      }
    }
    return { count, usesShotglass, fill };
  };

  // Always schedule the highest priority entry that fits, so that space freed by
  // a cleaner goes to the entries that were waiting on it.
  while (pending.some(({ remaining }) => remaining > 0)) {
    const next = pending
      .filter(({ remaining }) => remaining > 0)
      .map((entry) => ({ entry, ...fit(entry) }))
      .find(({ count }) => count > 0);
    if (!next) {
      const stuck = pending
        .filter(({ remaining }) => remaining > 0)
        .map(
          ({ dietEntry, remaining }) => `${remaining} ${dietEntry.target()}`,
        );
      throw `Unable to find an order to consume this diet; could not fit ${stuck.join(", ")}.`;
    }
    const { entry, count, usesShotglass, fill } = next;
    for (const organ of ORGANS) {
      used[organ] += count * (fill(organ) - entry.cleans[organ]);
    }
    if (usesShotglass) shotglassAvailable = false;
    entry.remaining -= count;
    tasks.push(dietEntryTask(entry.dietEntry, count, actions));
  }
  return tasks;
}

export function consumeDiet(diet: Diet<Note>, name: DietName): void {
  if (diet.entries.length === 0) return;

  print();
  printDiet(diet, name);
  print();

  const tasks = dietTasks(diet);
  logprint(`Diet order: ${tasks.map((task) => task.name).join(", ")}`);
  for (const task of tasks) task.perform();
}
