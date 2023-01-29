import { Task } from "grimoire-kolmafia";
import { create, handlingChoice, runChoice, toInt, useSkill } from "kolmafia";
import { $familiar, $item, $items, $skill, get, have } from "libram";
import { globalOptions } from "../config";
import { freeCrafts, maxBy } from "../lib";
import { garboValue } from "../session";

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
    choices: { [1414]: () => bestLockPickChoice() },
  },
  {
    name: "Cook Boris's key lime",
    ready: () =>
      globalOptions.ascend &&
      (freeCrafts() > 0 ||
        (have($familiar`Cookbookbat`) && get("_cookbookbatCrafting") < 5) ||
        get("hasChef")),
    completed: () =>
      !have($item`Boris's key`) || garboValue($item`Boris's key lime`) < garboValue($item`lime`),
    do: () => create($item`Boris's key lime`),
  },
  {
    name: "Cook Jarlsberg's key lime",
    ready: () =>
      globalOptions.ascend &&
      (freeCrafts() > 0 ||
        (have($familiar`Cookbookbat`) && get("_cookbookbatCrafting") < 5) ||
        get("hasChef")),
    completed: () =>
      !have($item`Jarlsberg's key`) ||
      garboValue($item`Jarlsberg's key lime`) < garboValue($item`lime`),
    do: () => create($item`Jarlsberg's key lime`),
  },
  {
    name: "Cook Sneaky Pete's key lime",
    ready: () =>
      (globalOptions.ascend &&
        (freeCrafts() > 0 || (have($familiar`Cookbookbat`) && get("_cookbookbatCrafting") < 5))) ||
      get("hasChef"),
    completed: () =>
      !have($item`Sneaky Pete's key`) ||
      garboValue($item`Sneaky Pete's key lime`) < garboValue($item`lime`),
    do: () => create($item`Sneaky Pete's key lime`),
  },
  {
    name: "Cook star key lime",
    ready: () =>
      globalOptions.ascend &&
      (freeCrafts() > 0 ||
        (have($familiar`Cookbookbat`) && get("_cookbookbatCrafting") < 5) ||
        get("hasChef")),
    completed: () =>
      !have($item`Richard's star key`) ||
      garboValue($item`star key lime`) < garboValue($item`lime`),
    do: () => create($item`star key lime`),
  },
];
