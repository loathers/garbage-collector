import { Task } from "grimoire-kolmafia";
import { create, handlingChoice, runChoice, toInt, useSkill } from "kolmafia";
import { $familiar, $item, $items, $skill, get, have, maxBy } from "libram";
import { globalOptions } from "../config";
import { freeCrafts } from "../lib";
import { garboValue } from "../value";

function bestLockPickChoice(): number {
  return (
    1 +
    toInt(
      maxBy($items`Boris's key lime, Jarlsberg's key lime, Sneaky Pete's key lime`, garboValue)
    ) -
    toInt($item`Boris's key lime`)
  );
}

export const AscendingTasks: Task[] = [
  {
    name: "Lock Picking",
    ready: () => have($skill`Lock Picking`) && globalOptions.ascend,
    completed: () => get("lockPicked"),
    do: (): void => {
      useSkill($skill`Lock Picking`);
      if (handlingChoice()) runChoice(-1);
    },
    choices: { 1414: () => bestLockPickChoice() },
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
    ready: () =>
      (globalOptions.ascend &&
        (freeCrafts() > 0 || (have($familiar`Cookbookbat`) && get("_cookbookbatCrafting") < 5))) ||
      get("hasChef"),
  })),
];
