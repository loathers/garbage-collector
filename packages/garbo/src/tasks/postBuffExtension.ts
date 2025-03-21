import { Quest } from "grimoire-kolmafia";
import { cliExecute } from "kolmafia";
import { Mining, realmAvailable } from "libram";
import { GarboTask } from "./engine";

const PostBuffExtensionTasks: GarboTask[] = [
  {
    name: "Free 70s Mining",
    ready: () => realmAvailable("hot"),
    completed: () => Mining.countFreeMines() <= 0,
    do: () => cliExecute("oreo 0"),
    spendsTurn: false,
  },
  // TODO Add Shadow Rift here if we ever grimoirize it
];

export const PostBuffExtensionQuest: Quest<GarboTask> = {
  name: "Post Buff Extension",
  tasks: PostBuffExtensionTasks,
};
