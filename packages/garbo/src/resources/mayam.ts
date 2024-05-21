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
    value: () => 5, // +30% item drop, I don't know how to value that?
    ring: 1,
  },
  {
    choice: "chair",
    value: () => 5, // +5 free rests, I don't know how to value that?
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
      if (globalOptions.prefs.valueOfAdventure === undefined) {
        return 4000 * 5;
      } else return globalOptions.prefs.valueOfAdventure * 5;
    },
    ring: 4,
  },
];

const AVAILABLE_RING_OPTIONS: MayamRingSummon[] = MAYAM_RING_OPTIONS.filter(
  (option) => {
    return !yamUses().includes(option.choice);
  },
);

function findRingValue(choice: string, ring: number): number {
  const option = AVAILABLE_RING_OPTIONS.find(
    (option) => option.choice === choice && option.ring === ring,
  );
  return option ? option.value() : 0;
}

function calculateCombinationValue(combination: string[]): number {
  const combinationString = combination.join(" ");
  const resonance = findResonance(combinationString);
  const baseValue = combination
    .map((choice, index) => findRingValue(choice, index + 1))
    .reduce((sum, value) => sum + value, 0);
  return resonance ? baseValue + garboValue(resonance.item) : baseValue;
}

function generateCombinations(): string[][] {
  const rings = MayamCalendar.RINGS;

  const combinations: string[][] = [];

  for (const r1 of rings[0]) {
    for (const r2 of rings[1]) {
      for (const r3 of rings[2]) {
        for (const r4 of rings[3]) {
          combinations.push([r1, r2, r3, r4]);
        }
      }
    }
  }

  return combinations;
}

export function findTopCombinations(): string[] {
  const combinations = generateCombinations();
  const combinationValues = combinations.map((combination) => ({
    combination: combination.join(" "),
    value: calculateCombinationValue(combination),
  }));

  combinationValues.sort((a, b) => b.value - a.value);

  const selectedCombinations: string[] = [];
  const usedSymbols: Set<string> = new Set();

  for (const { combination } of combinationValues) {
    const symbols = combination.split(" ");
    if (symbols.every((symbol) => !usedSymbols.has(symbol))) {
      selectedCombinations.push(combination);
      symbols.forEach((symbol) => usedSymbols.add(symbol));
      const yam4 = () => (yamUses().includes("yam4") ? 1 : 0);
      const explosion = () => (yamUses().includes("explosion") ? 1 : 0);
      const clock = () => (yamUses().includes("clock") ? 1 : 0);
      const remainingUses = 3 - (yam4() + explosion() + clock());
      if (selectedCombinations.length === remainingUses) break;
    }
  }

  return selectedCombinations;
}

function summonTask(): GarboTask {
  return {
    name: "Mayam Summons",
    completed: () =>
      ["yam4", "explosion", "clock"].every((sym) =>
        get("_mayamSymbolsUsed").includes(sym),
      ),
    do: () => {
      const ringOptions = findTopCombinations();
      const includesFur = ringOptions.some((option) => option.includes("fur"));

      if (includesFur) {
        const bestFamiliar = maxBy(
          getExperienceFamiliars("free"),
          (f) => f.expectedValue,
        );
        useFamiliar(bestFamiliar.familiar);
      }

      ringOptions.forEach((choice, index) => {
        const command = `mayam ${choice}`;
        // Adjust ring index (1-based) and add delay between summons
        setTimeout(() => cliExecute(command), index * 1000);
      });
    },
    spendsTurn: false,
  };
}

export function mayamSummonTask(): GarboTask[] {
  return [summonTask()];
}
