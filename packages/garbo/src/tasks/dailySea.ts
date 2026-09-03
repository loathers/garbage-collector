import { Quest } from "grimoire-kolmafia";
import { myLevel, runChoice, visitUrl } from "kolmafia";
import { $familiar, $item, get, have } from "libram";
import { GarboTask } from "./engine";

const DailySeaTasks: GarboTask[] = [
  {
    name: "Unlock The Sea",
    ready: () => myLevel() >= 11,
    completed: () => have($item`little bitty bathysphere`),
    do: () => {
      visitUrl("place.php?whichplace=sea_oldman");
      visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
    },
    spendsTurn: false,
    limit: { skip: 1 },
  },
  {
    name: $item`sea jelly`.name,
    ready: () =>
      have($familiar`Space Jellyfish`) && have($item`little bitty bathysphere`),
    completed: () => get("_seaJellyHarvested"),
    do: () => {
      visitUrl("place.php?whichplace=thesea&action=thesea_left2");
      runChoice(1);
    },
    outfit: { familiar: $familiar`Space Jellyfish` },
    spendsTurn: false,
    limit: { skip: 1 },
  },
];

export const DailySeaQuest: Quest<GarboTask> = {
  name: "Daily Sea",
  tasks: DailySeaTasks,
};
