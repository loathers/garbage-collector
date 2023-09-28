import { create, handlingChoice, runChoice, toInt, useSkill } from "kolmafia";
import { $item, $items, $skill, freeCrafts, get, have, maxBy } from "libram";
import { globalOptions } from "../config";
import { garboValue } from "../value";
import { GarboTask } from "./engine";
import { Quest } from "grimoire-kolmafia";

function bestLockPickChoice(): number {
  return (
    1 +
    toInt(
      maxBy($items`Boris's key lime, Jarlsberg's key lime, Sneaky Pete's key lime`, garboValue),
    ) -
    toInt($item`Boris's key lime`)
  );
}

const AscendingTasks: GarboTask[] = [
  {
    name: "Lock Picking",
    ready: () => have($skill`Lock Picking`) && globalOptions.ascend,
    completed: () => get("lockPicked"),
    do: (): void => {
      useSkill($skill`Lock Picking`);
      if (handlingChoice()) runChoice(-1);
    },
    choices: { 1414: bestLockPickChoice },
  },
  ...[
    {
      key: $item`Boris's key`,
      lime: $item`Boris's key lime`,
    },
    {
      key: $item`Jarlsberg's key`,
      lime: $item`Jarlsberg's key lime`,
    },
    {
      key: $item`Sneaky Pete's key`,
      lime: $item`Sneaky Pete's key lime`,
    },
    {
      key: $item`Richard's star key`,
      lime: $item`star key lime`,
    },
  ].map(({ key, lime }) => ({
    name: `Cook ${lime}`,
    completed: () => !have(key) || garboValue(lime) < garboValue($item`lime`),
    do: () => create(lime),
    ready: () => (globalOptions.ascend && freeCrafts("food") > 0) || get("hasChef"),
  })),
];

export const AscendingQuest: Quest<GarboTask> = {
  name: "Ascend",
  tasks: AscendingTasks,
};
