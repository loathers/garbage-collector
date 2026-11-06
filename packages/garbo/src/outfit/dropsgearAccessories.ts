import {
  Item,
  itemAmount,
  Modifier,
  myClass,
  stringModifier,
  toSlot,
} from "kolmafia";
import {
  $class,
  $item,
  $items,
  $skill,
  $slot,
  CinchoDeMayo,
  get,
  getModifier,
  have,
  LaughingStock,
  lgrCurrencies,
  sum,
  sumNumbers,
} from "libram";
import {
  basePointerRingMeat,
  felizValue,
  maxPassiveDamage,
  monsterManuelAvailable,
  withLocation,
} from "../lib";
import { maximumPinataCasts } from "../resources/yachtzee";
import { globalOptions } from "../config";
import { garboAverageValue, garboValue } from "../garboValue";
import { FarmingStrategy } from "../farmingStrategy";
import { estimatedGarboTurns } from "../turns";
import {
  BonusEquipMode,
  BonusGear,
  bonusGearValues,
  LIMITED_DROP_MODES,
} from "./lib";

const mafiaThumbRing = new BonusGear($item`mafia thumb ring`, {
  worksOnRun: false,
  modes: [BonusEquipMode.MEAT_TARGET, BonusEquipMode.BARF],
  value: () => (1 / 0.96 - 1) * get("valueOfAdventure"),
});

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

const luckyGoldRing = new BonusGear($item`lucky gold ring`, {
  worksOnRun: false,
  modes: [...LIMITED_DROP_MODES, BonusEquipMode.MEAT_TARGET],
  value: (mode) => {
    const dropValues = luckyGoldRingDropValues(
      !(mode === BonusEquipMode.MEAT_TARGET && !globalOptions.nobarf), // Volcoino drops once per day, only wear during meat targets if nobarf
      itemAmount($item`Freddy Kruegerand`) > 0,
    );

    // Items drop every ~10 turns
    return sumNumbers(dropValues) / dropValues.length / 10;
  },
});

function calculateMrCheengsSpectaclesBonus() {
  // Eligible potions are PvP-stealable and not banned by a future Standard season.
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
const mrCheengsSpectacles = new BonusGear($item`Mr. Cheeng's spectacles`, {
  worksOnRun: false,
  value: () => (mrCheengsBonus ??= calculateMrCheengsSpectaclesBonus()),
});

const mrScreegesSpectacles = new BonusGear($item`Mr. Screege's spectacles`, {
  worksOnRun: false,
  value: 180,
});

const cinchoDeMayo = new BonusGear($item`Cincho de Mayo`, {
  worksOnRun: true,
  modes: LIMITED_DROP_MODES,
  available: () =>
    CinchoDeMayo.currentCinch() !== 0 &&
    // Manuel and passive damage estimates keep stasis from killing the monster.
    monsterManuelAvailable() &&
    // Reserve cinch for Yachtzees, when applicable.
    maximumPinataCasts() > 0 &&
    maxPassiveDamage() < (FarmingStrategy.isUnderwater() ? 150 : 50),
  value: () => {
    // One Projectile Pinata yields three Robortender candies before combat ends.
    return 3 * felizValue();
  },
});

function calculateLaughingStockBonus(alwaysUseHorizon: boolean) {
  const basicFruitValue = garboAverageValue(
    ...$items`orange, grapefruit, grapes, lemon, lime, papaya, cranberries, strawberry, cherry, kumquat, tangerine, raspberry, kiwi, blackberry, banana, cactus fruit, plum, pear, peach`,
  );
  const classicFruitValue = garboAverageValue(
    ...$items`classic banana, antique watermelon, quince`,
  );

  const horizonValue = 0.02 * (0.1 * classicFruitValue + 0.9 * basicFruitValue);

  if (alwaysUseHorizon) return horizonValue;

  const nextDrop = LaughingStock.nextDrop();

  if (nextDrop) {
    const [fruit, fights] = nextDrop;
    if (fights > estimatedGarboTurns()) return 0;
    return Math.max(garboValue(fruit) / fights, horizonValue);
  }

  return horizonValue;
}

const portableLaughingStock = new BonusGear($item`Portable Laughing Stock`, {
  worksOnRun: false,
  modes: [...LIMITED_DROP_MODES, BonusEquipMode.MEAT_TARGET],
  value: (mode) =>
    calculateLaughingStockBonus(mode !== BonusEquipMode.MEAT_TARGET),
});

export function bonusAccessories(mode: BonusEquipMode): Map<Item, number> {
  // Keep this separate: turn estimates call usingThumbRing(), while Pantsgiving
  // itself needs a turn estimate. Including it here would recurse.
  return bonusGearValues(
    [
      mafiaThumbRing,
      luckyGoldRing,
      mrCheengsSpectacles,
      portableLaughingStock,
      mrScreegesSpectacles,
      cinchoDeMayo,
    ],
    mode,
  );
}

let cachedUsingThumbRing: boolean | null = null;
export function usingThumbRing(): boolean {
  if (!have($item`mafia thumb ring`)) {
    return false;
  }
  if (cachedUsingThumbRing === null) {
    const gear = bonusAccessories(BonusEquipMode.BARF);
    const accessoryBonuses = [...gear.entries()].filter(([item]) => have(item));

    // Mafia resolves env()/zone()/loc() modifiers against the last location
    // set, so restore it or unrelated gear is priced against this one.
    const meatAccessories = withLocation(FarmingStrategy.location, () =>
      Item.all()
        .filter(
          (item) =>
            have(item) &&
            toSlot(item) === $slot`acc1` &&
            getModifier("Meat Drop", item) > 0,
        )
        .map(
          (item) =>
            [
              item,
              getModifier("Meat Drop", item) * FarmingStrategy.meatDropValue(),
            ] as [Item, number],
        ),
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
