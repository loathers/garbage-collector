import {
  availableChoiceOptions,
  canAdventure,
  cliExecute,
  itemAmount,
  mallPrice,
  myAdventures,
  myLevel,
  myLocation,
  putCloset,
  reverseNumberology,
  runChoice,
  totalFreeRests,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $skill,
  AutumnAton,
  CinchoDeMayo,
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
  freeRest,
  juneCleaverChoiceValues,
  valueJuneCleaverOption,
} from "../../lib";
import { teleportEffects } from "../../mood";
import { GarboTask } from "../engine";
import { Quest } from "grimoire-kolmafia";
import bestAutumnatonLocation from "../../resources/autumnaton";
import { estimatedGarboTurns, remainingUserTurns } from "../../turns";
import { acquire } from "../../acquire";
import { garboAverageValue } from "../../garboValue";
import workshedTasks from "./worksheds";

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

function fallbot(): GarboTask {
  return {
    name: "Autumn-Aton",
    completed: () => !AutumnAton.available(),
    ready: () =>
      globalOptions.ascend ||
      AutumnAton.turnsForQuest() < estimatedGarboTurns() + remainingUserTurns(),
    do: () => {
      AutumnAton.sendTo(bestAutumnatonLocation);
    },
    spendsTurn: false,
  };
}

function refillCinch(): GarboTask {
  return {
    name: "Refill Cinch",
    ready: () => CinchoDeMayo.have() && totalFreeRests() > get("timesRested"),
    completed: () => CinchoDeMayo.currentCinch() >= 100,
    do: () => {
      const missingCinch = () => {
        return 100 - CinchoDeMayo.currentCinch();
      };
      // Only rest if we'll get full value out of the cinch
      // If our current cinch is less than the total available, it means we have free rests left.
      while (
        missingCinch() > CinchoDeMayo.cinchRestoredBy() &&
        CinchoDeMayo.currentCinch() < CinchoDeMayo.totalAvailableCinch()
      ) {
        if (!freeRest()) break;
      }
    },
    spendsTurn: false,
  };
}

let tokenBought = false;
function eightBitFatLoot(): GarboTask {
  return {
    name: "Check 8-Bit for Fat Loot",
    completed: () => tokenBought,
    ready: () =>
      canAdventure($location`The Spooky Forest`) && get("8BitScore") >= 20_000,
    do: () => {
      visitUrl("place.php?whichplace=8bit&action=8treasure");
      if (availableChoiceOptions()[2]) {
        runChoice(2);
      }
      tokenBought = true;
    },
    spendsTurn: false,
  };
}

let funguyWorthIt = true;

function funGuySpores(): GarboTask {
  return {
    name: "Fun-Guy Spores",
    ready: () =>
      funguyWorthIt &&
      myLevel() >= 15 &&
      (!globalOptions.ascend || myAdventures() > 11) &&
      get("dinseyRollercoasterNext"),
    completed: () => have($effect`Mush-Mouth`),
    do: () => {
      // According to wiki, it has a 75% chance of being a stat mushroom and 25% chance of being another mushroom
      const value =
        0.75 *
          garboAverageValue(
            ...$items`Boletus Broletus mushroom, Omphalotus Omphaloskepsis mushroom, Gyromitra Dynomita mushroom`,
          ) +
        0.25 *
          garboAverageValue(
            ...$items`Helvella Haemophilia mushroom, Stemonitis Staticus mushroom, Tremella Tarantella mushroom`,
          );
      if (
        mallPrice($item`Fun-Guy spore`) < value &&
        acquire(1, $item`Fun-Guy spore`, value, false) > 0
      ) {
        use($item`Fun-Guy spore`);
      } else funguyWorthIt = false;
    },
    spendsTurn: false,
  };
}

export function postQuest(completed?: () => boolean): Quest<GarboTask> {
  return {
    name: "Postcombat",
    completed,
    tasks: [
      ...workshedTasks(),
      fallbot(),
      closetStuff(),
      floristFriars(),
      numberology(),
      juneCleaver(),
      fillPantsgivingFullness(),
      fillSweatyLiver(),
      funGuySpores(),
      eightBitFatLoot(),
      refillCinch(),
    ],
  };
}
