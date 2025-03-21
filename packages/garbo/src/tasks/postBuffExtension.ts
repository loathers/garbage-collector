import { Quest } from "grimoire-kolmafia";
import { cliExecute, haveEffect } from "kolmafia";
import { $effect, $skill, get, have, realmAvailable } from "libram";
import { GarboTask } from "./engine";

const PostBuffExtensionTasks: GarboTask[] = [
  {
    name: "Free 70s Mining",
    ready: () =>
      realmAvailable("hot") &&
      (haveEffect($effect`Loded`) > 0 || have($skill`Unaccompanied Miner`)),
    completed: () =>
      get("_unaccompaniedMinerUsed") >= 5 && !haveEffect($effect`Loded`),
    do: () => cliExecute("oreo 0"),
    spendsTurn: false,
  },
  // TODO Add Shadow Rift here if we ever grimoirize it
];

export const PostBuffExtensionQuest: Quest<GarboTask> = {
  name: "Post Buff Extension",
  tasks: PostBuffExtensionTasks,
};
