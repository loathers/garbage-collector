import { cliExecute, useSkill } from "kolmafia";
import {
  $effect,
  $item,
  $skill,
  AprilingBandHelmet,
  get,
  have,
  set,
} from "libram";
import { AlternateTask } from "../tasks/engine";
import { shouldAugustCast } from "./scepter";

export type LuckySource = (typeof luckySourceTasks)[number]["name"];

export const luckySourceTasks = [
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
      get("_heartstoneLuckUsed"),
    do: () => {
      useSkill($skill`Heartstone: %luck`);
      if (!have($effect`Lucky!`)) return;
    },
    spendsTurn: false,
    turns: () =>
      have($item`Heartstone`) &&
      get("heartstoneLuckUnlocked") &&
      !get("_heartstoneLuckUsed")
        ? 1
        : 0,
  },
] as const satisfies AlternateTask[];
