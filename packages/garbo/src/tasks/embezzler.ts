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
} from "libram";
import { GarboTask } from "./engine";
import { shouldAugustCast } from "../resources";
import { canAdventure, cliExecute, useSkill } from "kolmafia";
import { meatTargetOutfit } from "../outfit";
import { GarboStrategy, Macro } from "../combat";
import { getBestLuckyAdventure } from "../lib";

export const EmbezzlerFightsQuest: Quest<GarboTask> = {
  name: "Lucky Embezzlers",
  ready: () =>
    getBestLuckyAdventure().phase === "target" &&
    getBestLuckyAdventure().value() > 0,
  tasks: [
    {
      name: "Scepter Lucky",
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
    },
    {
      name: "Saxophone Lucky",
      ready: () => !have($effect`Lucky!`),
      completed: () =>
        !AprilingBandHelmet.canPlay($item`Apriling band saxophone`),
      do: () => {
        AprilingBandHelmet.play($item`Apriling band saxophone`);
        if (!have($effect`Lucky!`)) return;
      },
      spendsTurn: false,
    },
    {
      name: "Pillkeeper Lucky",
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
    },
    {
      name: "Fight Lucky Embezzler",
      outfit: () => meatTargetOutfit({}, $location`Cobb's Knob Treasury`),
      ready: () => canAdventure($location`Cobb's Knob Treasury`),
      completed: () => !have($effect`Lucky!`),
      do: $location`Cobb's Knob Treasury`,
      spendsTurn: true,
      combat: new GarboStrategy(() => Macro.meatKill()),
    },
  ],
};
