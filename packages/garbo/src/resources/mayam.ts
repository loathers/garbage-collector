/* eslint-disable libram/verify-constants */
import { cliExecute, myLevel } from "kolmafia";
import { $item, clamp, get, maxBy } from "libram";
import { garboValue } from "../garboValue";
import { GarboTask } from "../tasks/engine";
import getExperienceFamiliars from "../familiar/experienceFamiliars";
import { globalOptions } from "../config";

type MayamRingSummon = {
  choice: string;
  value: () => number;
  ring: number;
};

/* type MayamResonanceSummon = {
  choice: string;
  value: () => number;
  components: string[];
} */

const yamUses = () => get("_mayamSymbolsUsed");

const MAYAM_RING_OPTIONS: MayamRingSummon[] = [
  {
    choice: "yam",
    value: () => garboValue($item`yam`),
    ring: 1,
  },
  {
    choice: "yam",
    value: () => garboValue($item`yam`),
    ring: 2,
  },
  {
    choice: "yam",
    value: () => garboValue($item`yam`),
    ring: 3,
  },
  {
    choice: "yam",
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
        ...getExperienceFamiliars().map(
          ({ expectedValue }) => expectedValue / 12,
        ),
      ) * 100,
    ring: 1,
  },
  {
    choice: "vessel",
    value: () => 5, // How do we value MP regen?
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
    // Translate "yam" to "yam1", "yam2", etc.
    const choice = option.choice.startsWith("yam")
      ? `yam${option.ring}`
      : option.choice;
    // Check if the translated choice appears in yamUses
    return !yamUses().includes(choice);
  },
);

/*
const MAYAM_RESONANCE_OPTIONS: MayamResonanceSummon[] = [
  {
    choice: "yam meat eyepatch yam",
    value: () => 0.05 * 275, // I don't know how to value a 55% meat accessory
    components: ["yam1", "meat", "eyepatch", "yam4"]
  },
  {
    choice: "eye yam eyepatch yam",
    value: () => garboValue($item`Mayam spinach`),
    components: ["eye", "yam2", "eyepatch", "yam4"]
  },
  {
    choice: "vessel yam cheese explosion",
    value: () => garboValue($item`stuffed yam stinkbomb`),
    components: ["vessel", "yam2", "cheese", "explosion"]
  },
  {
    choice: "yam yam yam explosion",
    value: () => garboValue($item`thanksgiving bomb`),
    components: ["yam1", "yam2", "yam3", "explosion"]
  },
  {
    choice: "yam meat cheese yam",
    value: () => garboValue($item`yam and swiss`),
    components: ["yam1", "meat", "cheese", "yam4"]
  },
  {
    choice: "yam lightning yam clock",
    value: () => garboValue($item`yam battery`),
    components: ["yam1", "lightning", "yam3", "clock"]
  },
];
*/

function bestRingOptions(): string[] {
  const bestOptions: string[] = [];

  for (let ring = 1; ring <= 4; ring++) {
    // Filter AVAILABLE_RING_OPTIONS for the current ring
    const ringOptions = AVAILABLE_RING_OPTIONS.filter(
      (option) => option.ring === ring,
    );

    // If there are no options for the current ring, continue to the next ring
    if (ringOptions.length === 0) {
      continue;
    }

    // Map ringOptions to an array of objects with 'choice' and 'value' properties
    const ringOptionsWithoutRing = ringOptions.map(({ choice, value }) => ({
      choice,
      value,
    }));

    // Find the best option for the current ring
    const bestOption = maxBy(ringOptionsWithoutRing, (option) =>
      option.value(),
    );

    // Add the choice of the best option to the result array
    if (bestOption) {
      bestOptions.push(bestOption.choice);
    }
  }

  return bestOptions;
}

function summonTask(): GarboTask {
  return {
    name: "Mayam Summons",
    completed: () =>
      ["yam4", "explosion", "clock"].every((sym) =>
        get("_mayamSymbolsUsed").includes(sym),
      ),
    do: () => {
      const ringOptions = bestRingOptions();
      ringOptions.forEach((choice, index) => {
        const command = `mayam ${choice}`;
        // Adjust ring index (1-based) and add 1 turn delay between summons
        setTimeout(() => cliExecute(command), index * 1000);
      });
    },
    spendsTurn: false,
  };
}

export function mayamSummonTask(): GarboTask[] {
  return [summonTask()];
}
