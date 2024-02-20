import { Quest } from "grimoire-kolmafia";
import { $item, $items, $location, CrystalBall, get, set } from "libram";
import { GarboTask } from "./engine";
import { GarboStrategy, Macro } from "../combat";
import { getChangeLastAdvLocationMethod } from "../embezzler/lib";
import { doingGregFight } from "../resources";
import { freeFightOutfit } from "../outfit";

export const SetupEmbezzlerQuest: Quest<GarboTask> = {
  name: "SetupEmbezzler",
  tasks: [
    {
      // Need the daily dungeon to either be totally finished or to be on a NC we can walk away from
      name: "Setup Daily Dungeon",
      outfit: () =>
        freeFightOutfit({ equip: $items`ring of Detect Boring Doors` }),
      // walk away from any nc we can walk away from, skip boring doors, open the final chest
      choices: () => ({ 689: 1, 690: 2, 691: 2, 692: 8, 693: 3 }),
      acquire: [{ item: $item`ring of Detect Boring Doors` }],
      ready: () =>
        getChangeLastAdvLocationMethod() === "dailydungeon" &&
        CrystalBall.have() &&
        doingGregFight(),
      completed: () =>
        get("dailyDungeonDone") ||
        ["It's Almost Certainly a Trap", "I Wanna Be a Door"].includes(
          get("_lastDailyDungeonEncounter"),
        ),
      do: $location`The Daily Dungeon`,
      post: () => set("_lastDailyDungeonEncounter", get("lastEncounter")),
      spendsTurn: true,
      combat: new GarboStrategy(() => Macro.kill()),
    },
  ],
};
