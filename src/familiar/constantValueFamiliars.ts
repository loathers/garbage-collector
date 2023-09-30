import { Familiar, familiarWeight, holiday, weightAdjustment } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  clamp,
  findLeprechaunMultiplier,
  get,
  getModifier,
  have,
  Robortender,
} from "libram";
import { baseMeat } from "../lib";
import { garboAverageValue, garboValue } from "../garboValue";
import { GeneralFamiliar } from "./lib";

type ConstantValueFamiliar = {
  familiar: Familiar;
  value: () => number;
};

const bestAlternative = getModifier("Meat Drop", $item`amulet coin`);
const standardFamiliars: ConstantValueFamiliar[] = [
  {
    familiar: $familiar`Obtuse Angel`,
    value: () => 0.02 * garboValue($item`time's arrow`),
  },
  {
    familiar: $familiar`Stocking Mimic`,
    value: () =>
      garboAverageValue(...$items`Polka Pop, BitterSweetTarts, Piddles`) / 6 -
      // We can't equip an amulet coin if we equip the bag of many confections
      (bestAlternative * baseMeat) / 100 +
      (1 / 3 + (have($effect`Jingle Jangle Jingle`) ? 0.1 : 0)) *
        (familiarWeight($familiar`Stocking Mimic`) + weightAdjustment()),
  },
  {
    familiar: $familiar`Shorter-Order Cook`,
    value: () =>
      garboAverageValue(
        ...$items`short beer, short stack of pancakes, short stick of butter, short glass of water, short white`,
      ) / 11, // 9 with blue plate
  },
  {
    familiar: $familiar`Robortender`,
    value: () =>
      garboValue($item`elemental sugarcube`) / 5 +
      (Robortender.currentDrinks().includes($item`Feliz Navidad`)
        ? get("garbo_felizValue", 0) * 0.25
        : 0) +
      (Robortender.currentDrinks().includes($item`Newark`)
        ? get("garbo_newarkValue", 0) * 0.25
        : 0),
  },
  {
    familiar: $familiar`Twitching Space Critter`,

    // Item is ludicrously overvalued and incredibly low-volume.
    // We can remove this cap once the price reaches a lower equilibrium
    // we probably won't, but we can.
    value: () => Math.min(garboValue($item`twitching space egg`) * 0.0002, 690),
  },
  {
    familiar: $familiar`Hobo Monkey`,
    value: () => 75,
  },
  {
    familiar: $familiar`Trick-or-Treating Tot`,
    // This is the value of getting a pirate costume over getting an amulet coin or whatever
    value: () =>
      have($item`li'l pirate costume`) ? (baseMeat * (300 - bestAlternative)) / 100 : 0,
  },
  {
    familiar: $familiar`Rockin' Robin`,
    value: () => garboValue($item`robin's egg`) / clamp(30 - get("rockinRobinProgress"), 1, 30),
  },
  {
    familiar: $familiar`Optimistic Candle`,
    value: () =>
      garboValue($item`glob of melted wax`) / clamp(30 - get("optimisticCandleProgress"), 1, 30),
  },
  {
    familiar: $familiar`Garbage Fire`,
    value: () =>
      garboAverageValue(
        ...$items`burning newspaper, extra-toasted half sandwich, mulled hobo wine`,
      ) / clamp(30 - get("garbageFireProgress"), 1, 30),
  },
  {
    familiar: $familiar`Cookbookbat`,
    value: () =>
      (3 *
        garboAverageValue(
          ...$items`Vegetable of Jarlsberg, Yeast of Boris, St. Sneaky Pete's Whey`,
        )) /
      11,
  },
  {
    familiar: $familiar`Patriotic Eagle`,
    value: () =>
      holiday().includes("Dependence Day") ? 0.05 * garboValue($item`souvenir flag`) : 0,
  },
];

export default function getConstantValueFamiliars(): GeneralFamiliar[] {
  return standardFamiliars
    .filter(({ familiar }) => have(familiar))
    .map(({ familiar, value }) => ({
      familiar,
      expectedValue: value(),
      leprechaunMultiplier: findLeprechaunMultiplier(familiar),
      limit: "none",
    }));
}
