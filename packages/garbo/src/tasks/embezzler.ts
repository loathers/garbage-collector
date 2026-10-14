import { Quest } from "grimoire-kolmafia";
import { $effect, $item, $items, $location, $monster, have } from "libram";
import { luckySourceTasks } from "../resources/lucky";
import { canAdventure, canEquip } from "kolmafia";
import { meatTargetOutfit } from "../outfit/target";
import { getBestLuckyAdventure, sober } from "../lib";
import { AlternateTask } from "./engine";
import { Macro } from "../combat";
import { GarboStrategy } from "../combatStrategy";

export const embezzlerFightTask = {
  name: "Fight Lucky Embezzler",
  outfit: () =>
    meatTargetOutfit(sober() ? {} : { equip: $items`Drunkula's wineglass` }, {
      location: $location`Cobb's Knob Treasury`,
      target: $monster`Knob Goblin Embezzler`,
    }),
  ready: () => canAdventure($location`Cobb's Knob Treasury`),
  completed: () => !have($effect`Lucky!`),
  do: $location`Cobb's Knob Treasury`,
  spendsTurn: true,
  combat: new GarboStrategy(() => Macro.meatKill()),
  turns: 0, // Turns spent are tracked by the lucky sources
} as const satisfies AlternateTask;

export const EmbezzlerFightsQuest: Quest<AlternateTask> = {
  name: "Lucky Embezzlers",
  ready: () =>
    getBestLuckyAdventure().phase === "target" &&
    getBestLuckyAdventure().value() > 0 &&
    (sober() ||
      (have($item`Drunkula's wineglass`) &&
        canEquip($item`Drunkula's wineglass`))),
  tasks: [...luckySourceTasks, embezzlerFightTask],
};
