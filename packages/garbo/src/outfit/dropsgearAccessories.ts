import {
  Item,
  itemAmount,
  Modifier,
  myClass,
  setLocation,
  stringModifier,
  toSlot,
} from "kolmafia";
import {
  $class,
  $item,
  $location,
  $skill,
  $slot,
  CinchoDeMayo,
  get,
  getModifier,
  have,
  lgrCurrencies,
  sum,
  sumNumbers,
} from "libram";
import {
  baseMeat,
  basePointerRingMeat,
  BonusEquipMode,
  felizValue,
  maxPassiveDamage,
  modeIsFree,
  monsterManuelAvailable,
} from "../lib";
import { maximumPinataCasts } from "../resources";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";

function mafiaThumbRing(mode: BonusEquipMode) {
  if (!have($item`mafia thumb ring`) || modeIsFree(mode)) {
    return new Map<Item, number>([]);
  }

  return new Map<Item, number>([
    [$item`mafia thumb ring`, (1 / 0.96 - 1) * get("valueOfAdventure")],
  ]);
}

export function luckyGoldRingDropValues(
  includeVolcoino: boolean,
  includeFreddy: boolean,
): number[] {
  // Volcoino has a low drop rate which isn't accounted for here
  // Overestimating until it drops is probably fine, don't @ me
  const dropValues = [
    100, // 80 - 120 meat
    ...[
      itemAmount($item`hobo nickel`) > 0 ? 100 : 0, // This should be closeted
      itemAmount($item`sand dollar`) > 0 ? garboValue($item`sand dollar`) : 0, // This should be closeted
      includeFreddy ? garboValue($item`Freddy Kruegerand`) : 0,
      ...lgrCurrencies().map((i) =>
        i === $item`Volcoino` && !includeVolcoino ? 0 : garboValue(i),
      ),
    ].filter((value) => value > 0),
  ];

  return dropValues;
}

function luckyGoldRing(mode: BonusEquipMode) {
  // Ignore for DMT, assuming mafia might get confused about the volcoino drop by the weird combats
  if (!have($item`lucky gold ring`) || mode === BonusEquipMode.DMT) {
    return new Map<Item, number>([]);
  }

  const dropValues = luckyGoldRingDropValues(
    !(mode === BonusEquipMode.MEAT_TARGET && !globalOptions.nobarf), // Volcoino drops once per day, only wear during meat targets if nobarf
    itemAmount($item`Freddy Kruegerand`) > 0,
  );

  // Items drop every ~10 turns
  return new Map<Item, number>([
    [$item`lucky gold ring`, sumNumbers(dropValues) / dropValues.length / 10],
  ]);
}

// Possible drops are any pvpable potion that are not marked as banned by standard in the future,
// which can be checked with the "Last Available" modifier being unset.
// Resulting value from this function should be cached to prevent reprocessing
function calculateMrCheengsSpectaclesBonus() {
  const lastAvailableModifier = Modifier.get("Last Available");
  const possibleDrops = Item.all().filter(
    (i) =>
      i.tradeable &&
      i.discardable &&
      i.potion &&
      stringModifier(i, lastAvailableModifier) === "",
  );
  const dropRate = 0.25; // Items drop every 4 turns
  const maxPrice = 100_000; // arbitrary, to help avoid outliers
  return (
    (sum(possibleDrops, (item) => Math.min(garboValue(item), maxPrice)) /
      possibleDrops.length) *
    dropRate
  );
}

let mrCheengsBonus: number;
function mrCheengsSpectacles() {
  if (!have($item`Mr. Cheeng's spectacles`)) {
    return new Map<Item, number>([]);
  }

  mrCheengsBonus ??= calculateMrCheengsSpectaclesBonus();

  return new Map<Item, number>([
    [$item`Mr. Cheeng's spectacles`, mrCheengsBonus],
  ]);
}

function mrScreegesSpectacles() {
  if (!have($item`Mr. Screege's spectacles`)) {
    return new Map<Item, number>([]);
  }

  // TODO: Calculate actual bonus value (good luck!)
  return new Map<Item, number>([[$item`Mr. Screege's spectacles`, 180]]);
}

function cinchoDeMayo(mode: BonusEquipMode) {
  if (
    !have($item`Cincho de Mayo`) ||
    CinchoDeMayo.currentCinch() === 0 ||
    // Ignore for DMT? Requires specific combat stuff, so probably weird there
    mode === BonusEquipMode.DMT ||
    mode === BonusEquipMode.MEAT_TARGET ||
    // Require manuel to make sure we don't kill during stasis
    !monsterManuelAvailable() ||
    // If we're doing Yachtzees, only use up excess cincho.
    maximumPinataCasts() <= 0 ||
    // If we have more than 50 passive damage, we'll never be able to cast projectile pinata without risking the monster dying
    maxPassiveDamage() >= 50
  ) {
    return new Map<Item, number>([]);
  }

  // Account for a single use of Projectile Pinata, which gives 3x Robortender candies
  return new Map<Item, number>([[$item`Cincho de Mayo`, 3 * felizValue()]]);
}

/*
This is separate from bonusGear to prevent circular references
bonusGear() calls pantsgiving(), which calls estimatedGarboTurns(), which calls usingThumbRing()
If this isn't separated from bonusGear(), usingThumbRing() will call bonusGear(), creating a dangerous loop
*/
export function bonusAccessories(mode: BonusEquipMode): Map<Item, number> {
  return new Map<Item, number>([
    ...mafiaThumbRing(mode),
    ...luckyGoldRing(mode),
    ...mrCheengsSpectacles(),
    ...mrScreegesSpectacles(),
    ...cinchoDeMayo(mode),
  ]);
}

let cachedUsingThumbRing: boolean | null = null;
/**
 * Calculates whether we expect to be wearing the thumb ring for most of the farming day.
 * This is used in functions that leverage projected turns; for instance, calculating the
 * number of turns of sweet synthesis required in our diet calcs or potion costs.
 * @returns boolean of whether we expect to be wearing the thumb ring for much of the day
 */
export function usingThumbRing(): boolean {
  if (!have($item`mafia thumb ring`)) {
    return false;
  }
  if (cachedUsingThumbRing === null) {
    const gear = bonusAccessories(BonusEquipMode.BARF);
    const accessoryBonuses = [...gear.entries()].filter(([item]) => have(item));

    setLocation($location`Barf Mountain`);
    const meatAccessories = Item.all()
      .filter(
        (item) =>
          have(item) &&
          toSlot(item) === $slot`acc1` &&
          getModifier("Meat Drop", item) > 0,
      )
      .map(
        (item) =>
          [item, (getModifier("Meat Drop", item) * baseMeat()) / 100] as [
            Item,
            number,
          ],
      );

    const accessoryValues = new Map<Item, number>(accessoryBonuses);
    for (const [accessory, value] of meatAccessories) {
      accessoryValues.set(
        accessory,
        value + (accessoryValues.get(accessory) ?? 0),
      );
    }

    if (
      have($item`mafia pointer finger ring`) &&
      ((myClass() === $class`Seal Clubber` && have($skill`Furious Wallop`)) ||
        have($item`haiku katana`) ||
        have($item`Operation Patriot Shield`) ||
        have($item`unwrapped knock-off retro superhero cape`) ||
        have($item`left bear arm`) ||
        have($skill`Head in the Game`))
    ) {
      accessoryValues.set(
        $item`mafia pointer finger ring`,
        basePointerRingMeat(),
      );
    }
    const bestAccessories = [...accessoryValues.entries()]
      .sort(([, aBonus], [, bBonus]) => bBonus - aBonus)
      .map(([item]) => item);
    cachedUsingThumbRing = bestAccessories
      .slice(0, 2)
      .includes($item`mafia thumb ring`);
  }
  return cachedUsingThumbRing;
}
