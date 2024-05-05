/* eslint-disable libram/verify-constants */
import { cliExecute, myLevel } from "kolmafia";
import { $item, clamp, get } from "libram";
import { garboValue } from "../garboValue";
import { GarboTask } from "../tasks/engine";
import getExperienceFamiliars from "../familiar/experienceFamiliars";
import { globalOptions } from "../config";

type MayamSummon = {
  choice: string;
  value: () => number;
  type: "resonance" | "ring";
  ring?: number;
};
const MAYAM_OPTIONS: MayamSummon[] = [
  {
    choice: "yam meat eyepatch yam",
    value: () => 0.05 * 275,
    type: "resonance",
  },
  {
    choice: "eye yam eyepatch yam",
    value: () => garboValue($item`Mayam spinach`),
    type: "resonance",
  },
  {
    choice: "vessel yam cheese explosion",
    value: () => garboValue($item`stuffed yam stinkbomb`),
    type: "resonance",
  },
  {
    choice: "yam yam yam explosion",
    value: () => garboValue($item`thanksgiving bomb`),
    type: "resonance",
  },
  {
    choice: "yam meat cheese yam",
    value: () => garboValue($item`yam and swiss`),
    type: "resonance",
  },
  {
    choice: "yam lightning yam clock",
    value: () => garboValue($item`yam battery`),
    type: "resonance",
  },
  {
    choice: "yam1",
    value: () => garboValue($item`yam`),
    type: "ring",
    ring: 1,
  },
  {
    choice: "yam2",
    value: () => garboValue($item`yam`),
    type: "ring",
    ring: 2,
  },
  {
    choice: "yam3",
    value: () => garboValue($item`yam`),
    type: "ring",
    ring: 3,
  },
  {
    choice: "yam4",
    value: () => garboValue($item`yam`),
    type: "ring",
    ring: 4,
  },
  {
    choice: "sword",
    value: () => 0,
    type: "ring",
    ring: 1,
  },
  {
    choice: "eye",
    value: () => 5, // +30% item drop, I don't know how to value that?
    type: "ring",
    ring: 1,
  },
  {
    choice: "chair",
    value: () => 5, // +5 free rests, I don't know how to value that?
    type: "ring",
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
    type: "ring",
    ring: 1,
  },
  {
    choice: "vessel",
    value: () => 5, // How do we value MP regen?
    type: "ring",
    ring: 1,
  },
  {
    choice: "lightning",
    value: () => 0,
    type: "ring",
    ring: 2,
  },
  {
    choice: "bottle",
    value: () => 0, // How do we value HP regen?
    type: "ring",
    ring: 2,
  },
  {
    choice: "meat",
    value: () => clamp(myLevel() * 100, 100, 1500),
    type: "ring",
    ring: 2,
  },
  {
    choice: "wood",
    value: () => 0,
    type: "ring",
    ring: 2,
  },
  {
    choice: "wall",
    value: () => 0,
    type: "ring",
    ring: 3,
  },
  {
    choice: "cheese",
    value: () => garboValue($item`goat cheese`),
    type: "ring",
    ring: 3,
  },
  {
    choice: "eyepatch",
    value: () => 0,
    type: "ring",
    ring: 3,
  },
  {
    choice: "explosion",
    value: () => 0,
    type: "ring",
    ring: 4,
  },
  {
    choice: "clock",
    value: () => {
      if (globalOptions.prefs.valueOfAdventure === undefined) {
        return 4000 * 5;
      } else return globalOptions.prefs.valueOfAdventure * 5;
    },
    type: "ring",
    ring: 4,
  },
];

function getBestMayamSummons(options: MayamSummon[]): MayamSummon[] {
  const filteredOptions = options.filter(
    ({ choice }) => !get("_mayamSymbolsUsed").includes(choice),
  );

  const sortedOptions = filteredOptions.sort((a, b) => b.value() - a.value());
  const selectedOptions: MayamSummon[] = [];
  const selectedRings: Set<number | undefined> = new Set();

  for (const option of sortedOptions) {
    if (selectedOptions.length === 3) break;

    if (option.type === "resonance") {
      const choiceItems = option.choice.split(" ");
      let canSelect = true;

      for (const item of choiceItems) {
        const ringOption = selectedOptions.find(
          (opt) => opt.type === "ring" && opt.choice === item,
        );
        if (!ringOption) {
          canSelect = false;
          break;
        }
      }

      if (canSelect) {
        const resonanceValue =
          option.value() +
          choiceItems.reduce((acc, item) => {
            const ringOption = selectedOptions.find(
              (opt) => opt.type === "ring" && opt.choice === item,
            );
            return acc + (ringOption ? ringOption.value() : 0);
          }, 0);

        selectedOptions.push({
          choice: option.choice,
          value: () => resonanceValue,
          type: "resonance",
        });
        choiceItems.forEach((item) => {
          const ringOptionIndex = selectedOptions.findIndex(
            (opt) => opt.type === "ring" && opt.choice === item,
          );
          selectedOptions.splice(ringOptionIndex, 1);
        });
      }
    } else if (option.type === "ring" && !selectedRings.has(option.ring)) {
      selectedOptions.push(option);
      selectedRings.add(option.ring);
    }
  }

  return selectedOptions;
}

function summonTask(): GarboTask {
  return {
    name: "Mayam Summons",
    completed: () =>
      ["yam4", "explosion", "clock"].every((sym) =>
        get("_mayamSymbolsUsed").includes(sym),
      ),
    do: () => {
      const mayamSummons = getBestMayamSummons(MAYAM_OPTIONS);
      mayamSummons.forEach((summon) => {
        const command = `mayam ${summon.choice}`;
        cliExecute(command);
      });
    },
    spendsTurn: false,
  };
}

export function mayamSummonTask(): GarboTask[] {
  return [summonTask()];
}
