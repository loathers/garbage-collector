import { Effect, Item, myLevel, useFamiliar } from "kolmafia";
import { $item, CinchoDeMayo, clamp, maxBy, MayamCalendar } from "libram";
import { garboValue } from "../garboValue";
import { GarboTask } from "../tasks/engine";
import getExperienceFamiliars from "../familiar/experienceFamiliars";
import { globalOptions } from "../config";
import { felizValue } from "../lib";
import { Potion } from "../potions";
import { copyTargetCount } from "../embezzler";

type RingOption = {
  choice: MayamCalendar.MayamSymbol;
  value: () => number;
};

const MAYAM_RING_OPTIONS1: RingOption[] = [
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
];

const MAYAM_RING_OPTIONS2: RingOption[] = [
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
];

const MAYAM_RING_OPTIONS3: RingOption[] = [
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
];

const MAYAM_RING_OPTIONS4: RingOption[] = [
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
    value: () => {
      return (globalOptions.prefs.valueOfAdventure ?? 4000) * 5;
    },
  },
];

function ringsAvailable(ringOptions: RingOption[]): RingOption[] {
  return ringOptions.filter((choice) =>
    MayamCalendar.available(choice.choice as MayamCalendar.MayamSymbol),
  );
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
  return Object.entries(MayamCalendar.RESONANCES)
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
  | MayamCalendar.CombinationString {
  const filteredOptions1 = ringsAvailable(MAYAM_RING_OPTIONS1);
  const filteredOptions2 = ringsAvailable(MAYAM_RING_OPTIONS2);
  const filteredOptions3 = ringsAvailable(MAYAM_RING_OPTIONS3);
  const filteredOptions4 = ringsAvailable(MAYAM_RING_OPTIONS4);

  // Check for the highest value in each ring, filtering by ring
  const ring1 = maxBy(filteredOptions1, (option) => option.value());
  const ring2 = maxBy(filteredOptions2, (option) => option.value());
  const ring3 = maxBy(filteredOptions3, (option) => option.value());
  const ring4 = maxBy(filteredOptions4, (option) => option.value());

  // Check for the highest value resonance
  const maxResonance = maxBy(availableResonances(), "value");

  // Sum the total ring value and determine the resonance value
  const totalRingValue =
    (ring1?.value() || 0) +
    (ring2?.value() || 0) +
    (ring3?.value() || 0) +
    (ring4?.value() || 0);
  const maxResonanceValue = maxResonance.value;

  // This doesn't work and I don't know why! :D

  const rings: MayamCalendar.Combination = [
    ring1.choice as MayamCalendar.Ring<0>,
    ring2.choice as MayamCalendar.Ring<1>,
    ring3.choice as MayamCalendar.Ring<2>,
    ring4.choice as MayamCalendar.Ring<3>,
  ];

  // If the resonance is worth more than the best possible rings, return the resonance, otherwise return the four rings
  if (maxResonance && maxResonanceValue > totalRingValue) {
    return maxResonance.combination as MayamCalendar.CombinationString;
  } else {
    return rings;
  }
}

function summonTask(): GarboTask {
  return {
    name: "Mayam Summons",
    completed: () => MayamCalendar.remainingUses() === 0,
    do: () => {
      while (MayamCalendar.remainingUses() > 0) {
        const ringOptions = findBestRingValue();
        const includesFur = ringOptions.includes("fur");

        // If we're going to use Fur, determine the best experience familiar and use it before using any rings
        if (includesFur) {
          const bestFamiliar = maxBy(
            getExperienceFamiliars("free"),
            (f) => f.expectedValue,
          );
          useFamiliar(bestFamiliar.familiar);
        }

        if (Array.isArray(ringOptions)) {
          return MayamCalendar.submit(...ringOptions);
        } else {
          return MayamCalendar.submit(ringOptions);
        }
      }
      return true;
    },
    spendsTurn: false,
  };
}

export function mayamSummonTask(): GarboTask[] {
  return [summonTask()];
}
