import {
  cliExecute,
  descToItem,
  equip,
  getWorkshed,
  handlingChoice,
  Item,
  itemAmount,
  myAdventures,
  myLevel,
  reverseNumberology,
  runChoice,
  totalTurnsPlayed,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $skill,
  $slot,
  AutumnAton,
  get,
  getRemainingStomach,
  have,
  JuneCleaver,
  property,
  uneffect,
  withProperty,
} from "libram";
import { acquire } from "./acquire";
import { averageAutumnatonValue, mostValuableUpgrade } from "./autumnaton";
import { garboAdventure, Macro } from "./combat";
import { computeDiet, consumeDiet } from "./diet";
import {
  bestJuneCleaverOption,
  globalOptions,
  juneCleaverChoiceValues,
  maxBy,
  safeInterrupt,
  safeRestore,
  setChoice,
  valueJuneCleaverOption,
} from "./lib";
import { teleportEffects } from "./mood";
import { garboAverageValue, garboValue, sessionSinceStart } from "./session";
import { estimatedTurns } from "./turns";

function coldMedicineCabinet(): void {
  if (getWorkshed() !== $item`cold medicine cabinet`) return;

  if (
    property.getNumber("_coldMedicineConsults") >= 5 ||
    property.getNumber("_nextColdMedicineConsult") > totalTurnsPlayed()
  ) {
    return;
  }
  const options = visitUrl("campground.php?action=workshed");
  let i = 0;
  let match;
  const regexp = /descitem\((\d+)\)/g;
  const itemChoices = new Map<Item, number>();
  if (!globalOptions.noBarf) {
    // if spending turns at barf, we probably will be able to get an extro so always consider it
    itemChoices.set($item`Extrovermectin™`, -1);
  }

  while ((match = regexp.exec(options)) !== null) {
    i++;
    const item = descToItem(match[1]);
    itemChoices.set(item, i);
  }

  const bestItem = maxBy([...itemChoices.keys()], garboValue);
  const bestChoice = itemChoices.get(bestItem);
  if (bestChoice && bestChoice > 0) {
    visitUrl("campground.php?action=workshed");
    runChoice(bestChoice);
  }
  if (handlingChoice()) visitUrl("main.php");
}

function fillPantsgivingFullness(): void {
  if (
    getRemainingStomach() > 0 &&
    (!globalOptions.yachtzeeChain || get("_garboYachtzeeChainCompleted", false))
  ) {
    consumeDiet(computeDiet().pantsgiving(), "PANTSGIVING");
  }
}

function fillSweatyLiver(): void {
  if (globalOptions.yachtzeeChain && !get("_garboYachtzeeChainCompleted", false)) return;

  const castsWanted = 3 - get("_sweatOutSomeBoozeUsed");
  if (castsWanted <= 0 || !have($item`designer sweatpants`)) return;

  const sweatNeeded = 25 * castsWanted;
  if (get("sweat") >= sweatNeeded) {
    while (get("_sweatOutSomeBoozeUsed") < 3) {
      useSkill($skill`Sweat Out Some Booze`);
    }
    consumeDiet(computeDiet().sweatpants(), "SWEATPANTS");
  }
}

function numberology(): void {
  if (
    myAdventures() > 0 &&
    Object.keys(reverseNumberology()).includes("69") &&
    get("_universeCalculated") < get("skillLevel144")
  ) {
    cliExecute("numberology 69");
  }
}

function updateMallPrices(): void {
  sessionSinceStart().value(garboValue);
}

let juneCleaverSkipChoices: typeof JuneCleaver.choices[number][] | null;
function skipJuneCleaverChoices(): void {
  if (!juneCleaverSkipChoices) {
    juneCleaverSkipChoices = [...JuneCleaver.choices]
      .sort(
        (a, b) =>
          valueJuneCleaverOption(juneCleaverChoiceValues[a][bestJuneCleaverOption(a)]) -
          valueJuneCleaverOption(juneCleaverChoiceValues[b][bestJuneCleaverOption(b)])
      )
      .splice(0, 3);
  }

  if (JuneCleaver.skipsRemaining() > 0) {
    for (const choice of juneCleaverSkipChoices) {
      setChoice(choice, 4);
    }
  } else {
    for (const choice of juneCleaverSkipChoices) {
      setChoice(choice, bestJuneCleaverOption(choice));
    }
  }
}
function juneCleave(): void {
  if (get("_juneCleaverFightsLeft") <= 0 && teleportEffects.every((e) => !have(e))) {
    equip($slot`weapon`, $item`June cleaver`);
    skipJuneCleaverChoices();
    withProperty("recoveryScript", "", () => {
      garboAdventure($location`Noob Cave`, Macro.abort());
      if (["Poetic Justice", "Lost and Found"].includes(get("lastEncounter"))) {
        uneffect($effect`Beaten Up`);
      }
    });
  }
}

function stillsuit() {
  if (itemAmount($item`tiny stillsuit`)) {
    const familiarTarget = $familiar`Blood-Faced Volleyball`;
    if (have(familiarTarget)) equip(familiarTarget, $item`tiny stillsuit`);
  }
}

let funguyWorthIt = true;
function funguySpores() {
  // Mush-Mouth will drop an expensive mushroom if you do a combat with one turn of it left
  if (
    myLevel() >= 15 && // It applies -100 to all stats, and Level 15 seems to be a reasonable place where you will survive -100 to all stats
    !have($effect`Mush-Mouth`) &&
    (!globalOptions.ascending || myAdventures() > 11) &&
    get("dinseyRollercoasterNext") && // If it were to expire on a rails adventure, you'd waste the cost of the spore. Using it when next turn is rails is easiest way to make sure it won't
    funguyWorthIt
  ) {
    // According to wiki, it has a 75% chance of being a stat mushroom and 25% chance of being another mushroom
    const value =
      0.75 *
        garboAverageValue(
          ...$items`Boletus Broletus mushroom, Omphalotus Omphaloskepsis mushroom, Gyromitra Dynomita mushroom`
        ) +
      0.25 *
        garboAverageValue(
          ...$items`Helvella Haemophilia mushroom, Stemonitis Staticus mushroom, Tremella Tarantella mushroom`
        );
    if (acquire(1, $item`Fun-Guy spore`, value, false) > 0) {
      use($item`Fun-Guy spore`);
    } else funguyWorthIt = false;
  }
}

export default function postCombatActions(skipDiet = false): void {
  juneCleave();
  numberology();
  if (!skipDiet && !globalOptions.noDiet) {
    fillPantsgivingFullness();
    fillSweatyLiver();
  }
  coldMedicineCabinet();
  safeInterrupt();
  safeRestore();
  updateMallPrices();
  stillsuit();
  funguySpores();
  if (globalOptions.ascending || AutumnAton.turnsForQuest() < estimatedTurns()) {
    AutumnAton.sendTo((locations) => maxBy(mostValuableUpgrade(locations), averageAutumnatonValue));
  }
}
