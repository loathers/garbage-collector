import { Quest } from "grimoire-kolmafia";
import { cliExecute, mallPrice, myAscensions, use } from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  ActionSource,
  ensureEffect,
  get,
  have,
  Mining,
  questStep,
  realmAvailable,
} from "libram";
import { GarboTask } from "./engine";
import { withStash } from "../clan";
import {
  burnLibrams,
  freeRunConstraints,
  ltbRun,
  sober,
  tryFindFreeRunOrBanish,
} from "../lib";
import { globalOptions } from "../config";
import { freeFightOutfit, toSpec } from "../outfit";
import { Macro } from "../combat";
import { GarboStrategy } from "../combatStrategy";
import { effectExtenderValue } from "../potions";

function getRun(): ActionSource {
  return tryFindFreeRunOrBanish(freeRunConstraints()) ?? ltbRun();
}

const BuffExtensionTasks: GarboTask[] = [
  {
    name: "Platinum Yendorian Express Card",
    completed: () => get("expressCardUsed"),
    do: () => {
      withStash($items`Platinum Yendorian Express Card`, () => {
        if (have($item`Platinum Yendorian Express Card`)) {
          burnLibrams();
          use($item`Platinum Yendorian Express Card`);
        }
      });
    },
    spendsTurn: false,
    limit: { skip: 1 },
  },
  {
    name: "Bag o' Tricks",
    completed: () => get("_bagOTricksUsed"),
    do: () => {
      withStash($items`Bag o' Tricks`, () => {
        if (have($item`Bag o' Tricks`)) {
          use($item`Bag o' Tricks`);
        }
      });
    },
    spendsTurn: false,
    limit: { skip: 1 },
  },
  {
    name: "License to Chill",
    ready: () => have($item`License to Chill`),
    completed: () => get("_licenseToChillUsed"),
    do: () => {
      burnLibrams();
      use($item`License to Chill`);
    },
    spendsTurn: false,
    limit: { skip: 1 },
  },
  {
    name: "Such Great Heights",
    ready: () =>
      globalOptions.ascend &&
      sober() &&
      !have($effect`Lucky!`) &&
      questStep("questM16Temple") > 0 &&
      mallPrice($item`stone wool`) <
        3 * get("valueOfAdventure") + effectExtenderValue(3, 10) &&
      !!getRun(),
    completed: () => get("lastTempleAdventures") >= myAscensions(),
    prepare: () => {
      getRun().constraints.preparation?.();
      ensureEffect($effect`Stone-Faced`);
    },
    do: $location`The Hidden Temple`,
    combat: new GarboStrategy(() =>
      Macro.step(getRun().macro).abortWithMsg(
        "Failed to freerun while attempting to reach Such Great Heights for buff extension",
      ),
    ),
    outfit: () => freeFightOutfit(toSpec(getRun())),
    choices: { 582: 1, 579: 3 },
    spendsTurn: false,
    limit: { tries: 5 }, // Stone-faced should immediately get us the Fitting In adventure. If we try this many times, something has gone wrong
  },
];

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

export const BuffExtensionQuest: Quest<GarboTask> = {
  name: "Buff Extension",
  tasks: BuffExtensionTasks,
};

export const PostBuffExtensionQuest: Quest<GarboTask> = {
  name: "Post Buff Extension",
  tasks: PostBuffExtensionTasks,
};
