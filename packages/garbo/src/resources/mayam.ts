/* eslint-disable libram/verify-constants */
import { cliExecute, Item, myLevel, useFamiliar } from "kolmafia";
import { $item, clamp, get, maxBy, MayamCalendar } from "libram";
import { garboValue } from "../garboValue";
import { GarboTask } from "../tasks/engine";
import getExperienceFamiliars from "../familiar/experienceFamiliars";
import { globalOptions } from "../config";

type MayamRingSummon = {
  choice: string;
  value: () => number;
  ring: number;
};

type Resonance = {
  rings: string;
  item: Item;
};

const RESONANCE: Resonance[] = [
  { rings: "eye yam2 eyepatch yam4", item: $item`Mayam spinach` },
  { rings: "vessel yam2 cheese explosion", item: $item`stuffed yam stinkbomb` },
  { rings: "yam1 meat cheese yam4", item: $item`yam and swiss` },
  { rings: "yam1 lightning yam3 clock", item: $item`yam battery` },
  { rings: "yam1 yam2 yam3 explosion", item: $item`thanksgiving bomb` },
  // {rings: "yam1 meat eyepatch yam4", item: $item`yamtility belt`}
];

const yamUses = () => get("_mayamSymbolsUsed");

function findResonance(rings: string): Resonance | undefined {
  return RESONANCE.find((resonance) => resonance.rings === rings);
}

// Function to find the resonance value
export function findResonanceValue(input: string): number {
  const result = findResonance(input);

  // Check if the result is found
  if (result) {
    return garboValue(result.item);
  }

  return 0;
}

const MAYAM_RING_OPTIONS: MayamRingSummon[] = [
  {
    choice: "yam1",
    value: () => garboValue($item`yam`),
    ring: 1,
  },
  {
    choice: "yam2",
    value: () => garboValue($item`yam`),
    ring: 2,
  },
  {
    choice: "yam3",
    value: () => garboValue($item`yam`),
    ring: 3,
  },
  {
    choice: "yam4",
    value: () => garboValue($item`yam`),
    ring: 4,
  },
  {
    choice: "sword",
    value: () => 0,
    ring: 1,
  },
  {
    choice: "eye",
    value: () => 0, // +30% item drop, I don't know how to value that?
    ring: 1,
  },
  {
    choice: "chair",
    value: () => 0, // +5 free rests, I don't know how to value that?
    ring: 1,
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
    ring: 1,
  },
  {
    choice: "vessel",
    value: () => 0, // How do we value MP regen?
    ring: 1,
  },
  {
    choice: "lightning",
    value: () => 0,
    ring: 2,
  },
  {
    choice: "bottle",
    value: () => 0, // How do we value HP regen?
    ring: 2,
  },
  {
    choice: "meat",
    value: () => clamp(myLevel() * 100, 100, 1500),
    ring: 2,
  },
  {
    choice: "wood",
    value: () => 0,
    ring: 2,
  },
  {
    choice: "wall",
    value: () => 0,
    ring: 3,
  },
  {
    choice: "cheese",
    value: () => garboValue($item`goat cheese`),
    ring: 3,
  },
  {
    choice: "eyepatch",
    value: () => 0,
    ring: 3,
  },
  {
    choice: "explosion",
    value: () => 0,
    ring: 4,
  },
  {
    choice: "clock",
    value: () => {
      return (globalOptions.prefs.valueOfAdventure ?? 4000) * 5;
    },
    ring: 4,
  },
];

// Check whether any individual ring is used before adding it to the list for MaxBy
const AVAILABLE_RING_OPTIONS: MayamRingSummon[] = MAYAM_RING_OPTIONS.filter(
  (option) => {
    return !yamUses().includes(option.choice);
  },
);

// Check whether any component of a resonance is used before adding it to the list for MaxBy
function isResonanceAvailable(resonance: Resonance): boolean {
  const usedChoices = yamUses()
    .split(",")
    .map((choice) => choice.trim());
  const resonanceChoices = resonance.rings.split(" ");
  return resonanceChoices.every((choice) => !usedChoices.includes(choice));
}

// Filter resonances to only include available ones
const AVAILABLE_RESONANCES = () => RESONANCE.filter(isResonanceAvailable);

function findBestRingValue():
  | MayamCalendar.CombinationString
  | MayamCalendar.Combination {
  const filteredOptions = AVAILABLE_RING_OPTIONS;

  // Check for the highest value in each ring, filtering by ring
  const ring1 = maxBy(
    filteredOptions.filter((option) => option.ring === 1),
    (option) => option.value(),
  );
  const ring2 = maxBy(
    filteredOptions.filter((option) => option.ring === 2),
    (option) => option.value(),
  );
  const ring3 = maxBy(
    filteredOptions.filter((option) => option.ring === 3),
    (option) => option.value(),
  );
  const ring4 = maxBy(
    filteredOptions.filter((option) => option.ring === 4),
    (option) => option.value(),
  );

  // Check for the highest value resonance
  const maxResonance = maxBy(AVAILABLE_RESONANCES(), (resonance) =>
    findResonanceValue(resonance.rings),
  );

  // Sum the total ring value and determine the resonance value
  const totalRingValue =
    (ring1?.value() || 0) +
    (ring2?.value() || 0) +
    (ring3?.value() || 0) +
    (ring4?.value() || 0);
  const maxResonanceValue = maxResonance
    ? findResonanceValue(maxResonance.rings)
    : 0;

  // If the resonance is worth more than the best possible rings, return the resonance, otherwise return the four rings
  if (maxResonance && maxResonanceValue > totalRingValue) {
    return maxResonance.rings as MayamCalendar.CombinationString;
  } else {
    const combination: MayamCalendar.Combination = [
      ring1.choice as MayamCalendar.Ring<0>,
      ring2.choice as MayamCalendar.Ring<1>,
      ring3.choice as MayamCalendar.Ring<2>,
      ring4.choice as MayamCalendar.Ring<3>,
    ];
    return combination;
  }
}

function summonTask(): GarboTask {
  return {
    name: "Mayam Summons",
    completed: () =>
      ["yam4", "explosion", "clock"].every((sym) =>
        get("_mayamSymbolsUsed").includes(sym),
      ),
    do: () => {
      while (
        !["yam4", "explosion", "clock"].every((sym) =>
          get("_mayamSymbolsUsed").includes(sym),
        )
      ) {
        const ringOptions =
          findBestRingValue() as MayamCalendar.CombinationString;
        const includesFur = ringOptions
          .split(" ")
          .some((option) => option.includes("fur"));

        // If we're going to use Fur, determine the best experience familiar and use it before using any rings
        if (includesFur) {
          const bestFamiliar = maxBy(
            getExperienceFamiliars("free"),
            (f) => f.expectedValue,
          );
          useFamiliar(bestFamiliar.familiar);
        }

        MayamCalendar.submit(ringOptions);

        ringOptions.split(" ").forEach((choice) => {
          const command = `mayam ${choice}`;
          // Adjust ring index (1-based) and add delay between summons
          cliExecute(command);
        });
      }
    },
    spendsTurn: false,
  };
}

export function mayamSummonTask(): GarboTask[] {
  return [summonTask()];
}
