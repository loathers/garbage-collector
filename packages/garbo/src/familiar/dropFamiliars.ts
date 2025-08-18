import { Familiar, Item } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  clamp,
  findLeprechaunMultiplier,
  get,
  have,
  totalFamiliarWeight,
} from "libram";
import { garboAverageValue, garboValue } from "../garboValue";
import { GeneralFamiliar } from "./lib";

type StandardDropFamiliar = {
  familiar: Familiar;
  expected: number[] | ((index: number) => number);
  drop: Item | Item[];
  additionalValue?: () => number;
  worksOnFreeRun?: boolean;
};

function expectedTurnsValue(
  expected: number[] | ((index: number) => number),
  index: number,
) {
  return Array.isArray(expected) ? expected[index] : expected(index);
}

function dropValue(drop: Item | Item[]): number {
  return drop instanceof Item ? garboValue(drop) : garboAverageValue(...drop);
}

function valueStandardDropFamiliar({
  familiar,
  expected,
  drop,
  additionalValue,
  worksOnFreeRun = false,
}: StandardDropFamiliar): GeneralFamiliar {
  const expectedTurns =
    expectedTurnsValue(expected, familiar.dropsToday) || Infinity;
  const expectedValue =
    dropValue(drop) / expectedTurns + (additionalValue?.() ?? 0);
  return {
    familiar,
    expectedValue,
    leprechaunMultiplier: findLeprechaunMultiplier(familiar),
    limit: "drops",
    worksOnFreeRun,
  };
}

// Rotating Value familiars are those whose drop rate changes, compare Constant Value familiars
const rotatingFamiliars: StandardDropFamiliar[] = [
  {
    familiar: $familiar`Fist Turkey`,
    expected: [3.91, 4.52, 4.52, 5.29, 5.29],
    drop: $item`Ambitious Turkey`,
  },
  {
    familiar: $familiar`Llama Lama`,
    expected: [3.42, 3.91, 4.52, 5.29, 5.29],
    drop: $item`llama lama gong`,
  },
  {
    familiar: $familiar`Astral Badger`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`astral mushroom`,
  },
  {
    familiar: $familiar`Li'l Xenomorph`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`transporter transponder`,
  },
  {
    familiar: $familiar`Rogue Program`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`Game Grid token`,
  },
  {
    familiar: $familiar`Bloovian Groose`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`groose grease`,
  },
  {
    familiar: $familiar`Baby Sandworm`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`agua de vida`,
  },
  {
    familiar: $familiar`Green Pixie`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`tiny bottle of absinthe`,
    // no drops can occur when Absinthe-Minded is active
    additionalValue: () =>
      have($effect`Absinthe-Minded`)
        ? -garboValue($item`tiny bottle of absinthe`)
        : 0,
  },
  {
    familiar: $familiar`Blavious Kloop`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`devilish folio`,
  },
  {
    familiar: $familiar`Galloping Grill`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`hot ashes`,
  },
  {
    familiar: $familiar`Grim Brother`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`grim fairy tale`,
  },
  {
    familiar: $familiar`Golden Monkey`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`powdered gold`,
  },
  {
    familiar: $familiar`Unconscious Collective`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`Unconscious Collective Dream Jar`,
  },
  {
    familiar: $familiar`Ms. Puck Man`,
    expected: Array($familiar`Ms. Puck Man`.dropsLimit).fill(12.85),
    drop: $item`power pill`,
    additionalValue: () => garboValue($item`yellow pixel`),
  },
  {
    familiar: $familiar`Puck Man`,
    expected: Array($familiar`Puck Man`.dropsLimit).fill(12.85),
    drop: $item`power pill`,
    additionalValue: () => garboValue($item`yellow pixel`),
  },
  {
    familiar: $familiar`Adventurous Spelunker`,
    expected: [7.0],
    drop: $item`Tales of Spelunking`,
  },
  {
    familiar: $familiar`Angry Jung Man`,
    expected: [30.0],
    drop: $item`psychoanalytic jar`,
  },
  {
    familiar: $familiar`Grimstone Golem`,
    expected: [45.0],
    drop: $item`grimstone mask`,
  },
  {
    familiar: $familiar`Cookbookbat`,
    expected: [33.0],
    drop: [
      $item`Recipe of Before Yore: Deep Dish of Legend`,
      $item`Recipe of Before Yore: Pizza of Legend`,
      $item`Recipe of Before Yore: Calzone of Legend`,
      $item`Recipe of Before Yore: plain calzone`,
      $item`Recipe of Before Yore: roasted vegetable focaccia`,
      $item`Recipe of Before Yore: baked veggie ricotta`,
      $item`Recipe of Before Yore: roasted vegetable of J.`,
      $item`Recipe of Before Yore: Pete's rich ricotta`,
      $item`Recipe of Before Yore: Boris's bread`,
      $item`Recipe of Before Yore: Boris's beer`,
      $item`Recipe of Before Yore: honey bun of Boris`,
      $item`Recipe of Before Yore: ratatouille de Jarlsberg`,
      $item`Recipe of Before Yore: Jarlsberg's vegetable soup`,
      $item`Recipe of Before Yore: Pete's wily whey bar`,
      $item`Recipe of Before Yore: St. Pete's sneaky smoothie`,
    ],
    additionalValue: () =>
      (3 *
        garboAverageValue(
          ...$items`Vegetable of Jarlsberg, Yeast of Boris, St. Sneaky Pete's Whey`,
        )) /
      11,
  },
  {
    familiar: $familiar`Hobo in Sheep's Clothing`,
    expected: (i) => 10 * i + 10, // faster with half-height cigar
    drop: $item`grubby wool`,
  },
  {
    familiar: $familiar`Jill-of-All-Trades`,
    expected: (i) => 3 * Math.pow(20, i),
    drop: $item`map to a candy-rich block`,
    additionalValue: () =>
      (6 + 4 * totalFamiliarWeight($familiar`Jill-of-All-Trades`)) * 0.33,
  },
  {
    familiar: $familiar`Rockin' Robin`,
    expected: (i) =>
      i === $familiar`Rockin' Robin`.dropsToday
        ? clamp(30 - get("rockinRobinProgress"), 1, 30)
        : 30,
    drop: $item`robin's egg`,
  },
  {
    familiar: $familiar`Optimistic Candle`,
    expected: (i) =>
      i === $familiar`Optimistic Candle`.dropsToday
        ? clamp(30 - get("optimisticCandleProgress"), 1, 30)
        : 30,
    drop: $item`glob of melted wax`,
  },
  {
    familiar: $familiar`Garbage Fire`,
    expected: (i) =>
      i === $familiar`Garbage Fire`.dropsToday
        ? clamp(30 - get("garbageFireProgress"), 1, 30)
        : 30,
    drop: $items`burning newspaper, extra-toasted half sandwich, mulled hobo wine`,
  },
];

export default function getDropFamiliars(): GeneralFamiliar[] {
  return rotatingFamiliars
    .map(valueStandardDropFamiliar)
    .filter(
      ({ familiar, expectedValue, leprechaunMultiplier }) =>
        have(familiar) && (expectedValue || leprechaunMultiplier),
    );
}

export function getAllDrops(
  fam: Familiar,
): { expectedValue: number; expectedTurns: number }[] {
  const target = rotatingFamiliars.find(({ familiar }) => familiar === fam);
  if (!have(fam) || !target) return [];

  const { expected, drop, additionalValue } = target;

  const current = fam.dropsToday;
  const returnValue = [];

  const length = Array.isArray(expected) ? expected.length : 11; // 11 seems a reasonable max
  for (let i = current; i < length; i++) {
    const turns = expectedTurnsValue(target.expected, i);
    returnValue.push({
      expectedValue: dropValue(drop) / turns + (additionalValue?.() ?? 0),
      expectedTurns: turns,
    });
  }

  return returnValue;
}
