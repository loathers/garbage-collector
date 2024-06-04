import { Effect, Item, myLevel, useFamiliar } from "kolmafia";
import {
  $item,
  CinchoDeMayo,
  clamp,
  get,
  maxBy,
  MayamCalendar,
  sum,
} from "libram";
import { garboValue } from "../garboValue";
import { GarboTask } from "../tasks/engine";
import getExperienceFamiliars from "../familiar/experienceFamiliars";
import { felizValue } from "../lib";
import { Potion } from "../potions";
import { copyTargetCount } from "../embezzler";

const MAYAM_RING_OPTIONS = [
  [
    {
      choice: "yam1",
      value: () => garboValue($item`yam`),
    },
    {
      choice: "sword",
      value: () => 0,
    },
    {
      choice: "eye",
      value: () => 0, // +30% item drop, I don't know how to value that?
    },
    {
      choice: "chair",
      value: () => (CinchoDeMayo.have() ? 3 * 5 * felizValue() : 0),
    },
    {
      choice: "fur",
      value: () =>
        Math.max(
          0,
          ...getExperienceFamiliars("free").map(
            ({ expectedValue }) => expectedValue / 12,
          ),
        ) * 100,
    },
    {
      choice: "vessel",
      value: () => 0, // How do we value MP regen?
    },
  ],
  [
    {
      choice: "yam2",
      value: () => garboValue($item`yam`),
    },
    {
      choice: "lightning",
      value: () => 0,
    },
    {
      choice: "bottle",
      value: () => 0, // How do we value HP regen?
    },
    {
      choice: "meat",
      value: () => clamp(myLevel() * 100, 100, 1500),
    },
    {
      choice: "wood",
      value: () => 0,
    },
  ],
  [
    {
      choice: "wall",
      value: () => 0,
    },
    {
      choice: "cheese",
      value: () => garboValue($item`goat cheese`),
    },
    {
      choice: "eyepatch",
      value: () => 0,
    },
    {
      choice: "yam3",
      value: () => garboValue($item`yam`),
    },
  ],
  [
    {
      choice: "yam4",
      value: () => garboValue($item`yam`),
    },
    {
      choice: "explosion",
      value: () => 0,
    },
    {
      choice: "clock",
      value: () => get("valueOfAdventure") * 5,
    },
  ],
] as const;

type RingOption<R extends number> = (typeof MAYAM_RING_OPTIONS)[R][number];

function symbolsAvailable<R extends number>(
  ringOptions: readonly RingOption<R>[],
): RingOption<R>[] {
  return ringOptions.filter(({ choice }) => MayamCalendar.available(choice));
}

function effectValue(effect: Effect, duration: number): number {
  return new Potion($item.none, { effect, duration }).gross(copyTargetCount());
}

function getResonanceValue(
  combination: MayamCalendar.CombinationString,
): number {
  const result = MayamCalendar.getResonanceResult(combination);
  if (!result) return 0;
  if (result instanceof Item) {
    if (result === $item`yamtility belt`) return 0; // yamtilityValue();
    return garboValue(result);
  }
  return effectValue(result, 30);
}

const availableResonances = () => {
  return (
    Object.entries(MayamCalendar.RESONANCES) as [
      keyof typeof MayamCalendar.RESONANCES,
      Item | Effect,
    ][]
  )
    .filter(([combination]) => {
      const symbols = combination.split(" ");
      return MayamCalendar.available(...(symbols as MayamCalendar.Combination));
    })
    .map(([combination, result]) => ({
      combination: combination,
      result: result,
      value: getResonanceValue(combination as MayamCalendar.CombinationString),
    }));
};

function findBestRingValue():
  | MayamCalendar.Combination
  | [MayamCalendar.CombinationString] {
  const bestSymbols = MAYAM_RING_OPTIONS.map(symbolsAvailable).map(
    (filteredOptions) => maxBy(filteredOptions, (option) => option.value()),
  ) as [RingOption<0>, RingOption<1>, RingOption<2>, RingOption<3>];

  // Check for the highest value resonance
  const maxResonance = maxBy(availableResonances(), "value");

  // Sum the total ring value and determine the resonance value
  const totalRingValue = sum(bestSymbols, (option) => option.value());
  const ring = bestSymbols.map(
    ({ choice }) => choice,
  ) as MayamCalendar.Combination;

  // If the resonance is worth more than the best possible rings, return the resonance, otherwise return the four rings
  if (maxResonance && maxResonance.value > totalRingValue) {
    return [maxResonance.combination as MayamCalendar.CombinationString];
  } else {
    return ring;
  }
}

function summonTask(): GarboTask {
  return {
    name: "Mayam Summons",
    completed: () => MayamCalendar.remainingUses() === 0,
    do: () => {
      while (MayamCalendar.remainingUses() > 0) {
        const ringOptions = findBestRingValue();
        const includesFur = ringOptions.some((entry) => entry.includes("fur"));

        // If we're going to use Fur, determine the best experience familiar and use it before using any rings
        if (includesFur) {
          const bestFamiliar = maxBy(
            getExperienceFamiliars("free"),
            "expectedValue",
          ).familiar;
          useFamiliar(bestFamiliar);
        }

        MayamCalendar.submit(...ringOptions);
      }
      return true;
    },
    spendsTurn: false,
  };
}

export function mayamSummonTask(): GarboTask[] {
  return [summonTask()];
}
