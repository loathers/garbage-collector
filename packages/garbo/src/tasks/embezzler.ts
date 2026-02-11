import { Quest } from "grimoire-kolmafia";
import {
  $effect,
  $item,
  $items,
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
import { canAdventure, canEquip, cliExecute, useSkill } from "kolmafia";
import { meatTargetOutfit } from "../outfit";
import { getBestLuckyAdventure, sober } from "../lib";
import { AlternateTask } from "./engine";
import { Macro } from "../combat";
import { GarboStrategy } from "../combatStrategy";

export function embezzlerFights(...exludedLuckySources: LuckySource[]): number {
  return sum(
    luckySourceTasks.filter(
      (t) =>
        !exludedLuckySources.includes(t.name) &&
        (t.ready?.() ?? true) &&
        !t.completed(),
    ),
    (t) => undelay(t.turns),
  );
}

export type LuckySource = (typeof luckySourceTasks)[number]["name"];

const luckySourceTasks = [
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
  {
    name: "Heartstone",
    ready: () => !have($effect`Lucky!`),
    completed: () =>
      !have($item`Heartstone`) ||
      !get("heartstoneLuckUnlocked") ||
      get("_heartstoneLuckUsed", true),
    do: () => {
      useSkill($skill`Heartstone: %luck`);
      if (!have($effect`Lucky!`)) return;
    },
    spendsTurn: false,
    turns: () =>
      have($item`Heartstone`) &&
      get("heartstoneLuckUnlocked") &&
      !get("_heartstoneLuckUsed", true)
        ? 1
        : 0,
  },
] as const satisfies AlternateTask[];

export const EmbezzlerFightsQuest: Quest<AlternateTask> = {
  name: "Lucky Embezzlers",
  ready: () =>
    getBestLuckyAdventure().phase === "target" &&
    getBestLuckyAdventure().value() > 0 &&
    (sober() ||
      (have($item`Drunkula's wineglass`) &&
        canEquip($item`Drunkula's wineglass`))),
  tasks: [
    ...luckySourceTasks,
    {
      name: "Fight Lucky Embezzler",
      outfit: () =>
        meatTargetOutfit(
          sober() ? {} : { equip: $items`Drunkula's wineglass` },
          $location`Cobb's Knob Treasury`,
        ),
      ready: () => canAdventure($location`Cobb's Knob Treasury`),
      completed: () => !have($effect`Lucky!`),
      do: $location`Cobb's Knob Treasury`,
      spendsTurn: true,
      combat: new GarboStrategy(() => Macro.meatKill()),
      turns: 0, // Turns spent are tracked by the lucky sources
    },
  ],
};
