import { Quest } from "grimoire-kolmafia";
import {
  $effect,
  $item,
  $location,
  $skill,
  AprilingBandHelmet,
  get,
  have,
  set,
  sum,
  undelay,
} from "libram";
import { shouldAugustCast } from "../resources";
import { canAdventure, cliExecute, useSkill } from "kolmafia";
import { meatTargetOutfit } from "../outfit";
import { GarboStrategy, Macro } from "../combat";
import { AlternateTask, getBestLuckyAdventure } from "../lib";

export function embezzlerFights(
  ...exludedLuckySources: embezzlerLuckySource[]
): number {
  return sum(
    EmbezzlerFightsQuest.tasks.filter(
      (t) =>
        (t.ready?.() ?? true) &&
        !t.completed() &&
        !exludedLuckySources.includes(t.name),
    ),
    (t) => undelay(t.turns),
  );
}

export type embezzlerLuckySource = (typeof luckySourceTasks)[number]["name"];

const luckySourceTasks: AlternateTask[] = [
  {
    name: "Scepter",
    acquire: [{ item: $item`august scepter` }],
    ready: () => !have($effect`Lucky!`),
    completed: () =>
      !shouldAugustCast($skill`Aug. 2nd: Find an Eleven-Leaf Clover Day`),
    do: () => {
      useSkill($skill`Aug. 2nd: Find an Eleven-Leaf Clover Day`);
      if (!have($effect`Lucky!`)) {
        set("_aug2Cast", true);
      }
    },
    spendsTurn: false,
    turns: () =>
      shouldAugustCast($skill`Aug. 2nd: Find an Eleven-Leaf Clover Day`)
        ? 1
        : 0,
  },
  {
    name: "Saxophone",
    ready: () => !have($effect`Lucky!`),
    completed: () =>
      !AprilingBandHelmet.canPlay($item`Apriling band saxophone`),
    do: () => {
      AprilingBandHelmet.play($item`Apriling band saxophone`);
      if (!have($effect`Lucky!`)) return;
    },
    spendsTurn: false,
    turns: () => $item`Apriling band saxophone`.dailyusesleft,
  },
  {
    name: "Pillkeeper",
    acquire: [{ item: $item`Eight Days a Week Pill Keeper` }],
    ready: () =>
      !have($effect`Lucky!`) && have($item`Eight Days a Week Pill Keeper`),
    completed: () => get("_freePillKeeperUsed"),
    do: () => {
      cliExecute("pillkeeper semirare");
      if (!have($effect`Lucky!`)) {
        set("_freePillKeeperUsed", true);
        return;
      }
    },
    spendsTurn: false,
    turns: () =>
      have($item`Eight Days a Week Pill Keeper`) && !get("_freePillKeeperUsed")
        ? 1
        : 0,
  },
] as const;

export const EmbezzlerFightsQuest: Quest<AlternateTask> = {
  name: "Lucky Embezzlers",
  ready: () =>
    getBestLuckyAdventure().phase === "target" &&
    getBestLuckyAdventure().value() > 0,
  tasks: [
    ...luckySourceTasks,
    {
      name: "Fight Lucky Embezzler",
      outfit: () => meatTargetOutfit({}, $location`Cobb's Knob Treasury`),
      ready: () => canAdventure($location`Cobb's Knob Treasury`),
      completed: () => !have($effect`Lucky!`),
      do: $location`Cobb's Knob Treasury`,
      spendsTurn: true,
      combat: new GarboStrategy(() => Macro.meatKill()),
      turns: 0, // Turns spent are tracked by the lucky sources
    },
  ],
};
