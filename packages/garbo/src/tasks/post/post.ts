import {
  cliExecute,
  itemAmount,
  myLocation,
  putCloset,
  reverseNumberology,
  useSkill,
} from "kolmafia";
import {
  $item,
  $items,
  $location,
  $skill,
  clamp,
  FloristFriar,
  get,
  getRemainingStomach,
  have,
  JuneCleaver,
} from "libram";
import { GarboStrategy, Macro } from "../../combat";
import { globalOptions } from "../../config";
import { computeDiet, consumeDiet } from "../../diet";
import {
  bestJuneCleaverOption,
  juneCleaverChoiceValues,
  valueJuneCleaverOption,
} from "../../lib";
import { teleportEffects } from "../../mood";
import { GarboTask } from "../engine";
import { Quest } from "grimoire-kolmafia";

const STUFF_TO_CLOSET = $items`bowling ball, funky junk key`;
function closetStuff(): GarboTask {
  return {
    name: "Closet Stuff",
    completed: () => STUFF_TO_CLOSET.every((i) => itemAmount(i) === 0),
    do: () => STUFF_TO_CLOSET.forEach((i) => putCloset(itemAmount(i), i)),
    spendsTurn: false,
  };
}

const BARF_PLANTS = [
  FloristFriar.StealingMagnolia,
  FloristFriar.AloeGuvnor,
  FloristFriar.PitcherPlant,
];
function floristFriars(): GarboTask {
  return {
    name: "Florist Plants",
    completed: () => FloristFriar.isFull(),
    ready: () =>
      myLocation() === $location`Barf Mountain` &&
      FloristFriar.have() &&
      BARF_PLANTS.some((flower) => flower.available()),
    do: () =>
      BARF_PLANTS.filter((flower) => flower.available()).forEach((flower) =>
        flower.plant(),
      ),
    spendsTurn: false,
  };
}

function fillPantsgivingFullness(): GarboTask {
  return {
    name: "Fill Pantsgiving Fullness",
    ready: () => !globalOptions.nodiet,
    completed: () => getRemainingStomach() <= 0,
    do: () => consumeDiet(computeDiet().pantsgiving(), "PANTSGIVING"),
    spendsTurn: false,
  };
}

function fillSweatyLiver(): GarboTask {
  return {
    name: "Fill Sweaty Liver",
    ready: () => have($item`designer sweatpants`) && !globalOptions.nodiet,
    completed: () =>
      get("sweat") < 25 * clamp(3 - get("_sweatOutSomeBoozeUsed"), 0, 3),
    do: () => {
      while (get("_sweatOutSomeBoozeUsed") < 3) {
        useSkill($skill`Sweat Out Some Booze`);
      }
      consumeDiet(computeDiet().sweatpants(), "SWEATPANTS");
    },
    spendsTurn: false,
  };
}

function numberology(): GarboTask {
  return {
    name: "Numberology",
    ready: () => Object.keys(reverseNumberology()).includes("69"),
    completed: () => get("_universeCalculated") >= get("skillLevel144"),
    do: () => cliExecute("numberology 69"),
    spendsTurn: false,
  };
}

let juneCleaverSkipChoices: (typeof JuneCleaver.choices)[number][] | null;

function getJuneCleaverskipChoices(): (typeof JuneCleaver.choices)[number][] {
  if (JuneCleaver.skipsRemaining() > 0) {
    if (!juneCleaverSkipChoices) {
      juneCleaverSkipChoices = [...JuneCleaver.choices]
        .sort(
          (a, b) =>
            valueJuneCleaverOption(
              juneCleaverChoiceValues[a][bestJuneCleaverOption(a)],
            ) -
            valueJuneCleaverOption(
              juneCleaverChoiceValues[b][bestJuneCleaverOption(b)],
            ),
        )
        .splice(0, 3);
    }
    return [...juneCleaverSkipChoices];
  }
  return [];
}

const juneCleaverChoices = () =>
  Object.fromEntries(
    JuneCleaver.choices.map((choice) => [
      choice,
      getJuneCleaverskipChoices().includes(choice)
        ? 4
        : bestJuneCleaverOption(choice),
    ]),
  );

function juneCleaver(): GarboTask {
  return {
    name: "June Cleaver",
    ready: () => JuneCleaver.have() && teleportEffects.every((e) => !have(e)),
    completed: () => get("_juneCleaverFightsLeft") > 0,
    do: $location`Noob Cave`,
    outfit: { weapon: $item`June cleaver` },
    combat: new GarboStrategy(
      Macro.abortWithMsg(
        `Expected June Cleaver non-combat but ended up in combat.`,
      ),
    ),
    choices: juneCleaverChoices,
    spendsTurn: false,
  };
}

export function postQuest(completed?: () => boolean): Quest<GarboTask> {
  return {
    name: "Postcombat",
    completed,
    tasks: [
      closetStuff(),
      floristFriars(),
      numberology(),
      juneCleaver(),
      fillPantsgivingFullness(),
      fillSweatyLiver(),
    ],
  };
}
