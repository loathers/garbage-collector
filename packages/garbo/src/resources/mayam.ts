import { Effect, Item, myLevel, useFamiliar } from "kolmafia";
import { $item, CinchoDeMayo, clamp, get, maxBy, MayamCalendar } from "libram";
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

type RingOptionSet0 = (typeof MAYAM_RING_OPTIONS)[0][number];
type RingOptionSet1 = (typeof MAYAM_RING_OPTIONS)[1][number];
type RingOptionSet2 = (typeof MAYAM_RING_OPTIONS)[2][number];
type RingOptionSet3 = (typeof MAYAM_RING_OPTIONS)[3][number];

type RingOptionsArray = [
  RingOptionSet0[],
  RingOptionSet1[],
  RingOptionSet2[],
  RingOptionSet3[],
];

function findBestThreeValueCombinations(
  ringOptionsArray: RingOptionsArray,
): { combination: MayamCalendar.Combination; value: number }[] {
  const combinations: {
    combination: MayamCalendar.Combination;
    value: number;
  }[] = [];

  for (const option1 of ringOptionsArray[0]) {
    for (const option2 of ringOptionsArray[1]) {
      for (const option3 of ringOptionsArray[2]) {
        for (const option4 of ringOptionsArray[3]) {
          const combination = [
            option1.choice,
            option2.choice,
            option3.choice,
            option4.choice,
          ] as MayamCalendar.Combination;
          const value =
            option1.value() +
            option2.value() +
            option3.value() +
            option4.value();

          combinations.push({ combination, value });
        }
      }
    }
  }

  // Sort combinations by value in descending order and return the top three
  combinations.sort((a, b) => b.value - a.value);
  return combinations.slice(0, 3);
}

function symbolsAvailable0(
  ringOptions: readonly RingOptionSet0[],
): RingOptionSet0[] {
  return ringOptions.filter(({ choice }) => MayamCalendar.available(choice));
}

function symbolsAvailable1(
  ringOptions: readonly RingOptionSet1[],
): RingOptionSet1[] {
  return ringOptions.filter(({ choice }) => MayamCalendar.available(choice));
}

function symbolsAvailable2(
  ringOptions: readonly RingOptionSet2[],
): RingOptionSet2[] {
  return ringOptions.filter(({ choice }) => MayamCalendar.available(choice));
}

function symbolsAvailable3(
  ringOptions: readonly RingOptionSet3[],
): RingOptionSet3[] {
  return ringOptions.filter(({ choice }) => MayamCalendar.available(choice));
}

function getAvailableRingOptions(): RingOptionsArray {
  return [
    symbolsAvailable0(MAYAM_RING_OPTIONS[0]),
    symbolsAvailable1(MAYAM_RING_OPTIONS[1]),
    symbolsAvailable2(MAYAM_RING_OPTIONS[2]),
    symbolsAvailable3(MAYAM_RING_OPTIONS[3]),
  ];
}

function findBestRingValues(): (
  | MayamCalendar.Combination
  | [MayamCalendar.CombinationString]
)[] {
  const availableRingOptions = getAvailableRingOptions();

  const bestCombinations = findBestThreeValueCombinations(availableRingOptions);

  const maxResonance = maxBy(availableResonances(), "value");

  const resultCombinations = bestCombinations.map(
    ({ combination }) => combination,
  );

  if (maxResonance && maxResonance.value > bestCombinations[0].value) {
    return [[maxResonance.combination as MayamCalendar.CombinationString]];
  } else {
    return resultCombinations;
  }
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

function summonTask(): GarboTask {
  return {
    name: "Mayam Summons",
    completed: () => MayamCalendar.remainingUses() === 0,
    do: () => {
      while (MayamCalendar.remainingUses() > 0) {
        const ringOptions = findBestRingValues();

        const bestFamiliar = maxBy(
          getExperienceFamiliars("free"),
          "expectedValue",
        ).familiar;
        useFamiliar(bestFamiliar);

        for (const option of ringOptions) {
          MayamCalendar.submit(...option);
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
