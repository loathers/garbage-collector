import { Quest } from "grimoire-kolmafia";
import { $item, $items, $location, get, set } from "libram";
import { GarboTask } from "./engine";
import { GarboStrategy, Macro } from "../combat";
import { getChangeLastAdvLocationMethod } from "../embezzler/lib";

export const SetupEmbezzlerQuest: Quest<GarboTask> = {
  name: "SetupEmbezzler",
  tasks: [
    {
      name: "Setup Daily Dungeon",
      outfit: { equip: $items`ring of Detect Boring Doors` },
      choices: () => ({ 690: 2 }),
      acquire: [{ item: $item`ring of Detect Boring Doors` }],
      ready: () => getChangeLastAdvLocationMethod() === "dailydungeon",
      completed: () =>
        get("dailyDungeonDone") ||
        get("_lastDailyDungeonEncounter") === "It's Almost Certainly a Trap",
      do: $location`The Daily Dungeon`,
      post: () => set("_lastDailyDungeonEncounter", get("lastEncounter")),
      spendsTurn: true,
      combat: new GarboStrategy(Macro.kill()),
    },
  ],
};
