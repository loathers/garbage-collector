import {
  cliExecute,
  descToItem,
  equip,
  getWorkshed,
  Item,
  myAdventures,
  reverseNumberology,
  runChoice,
  totalTurnsPlayed,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $slot,
  adventureMacro,
  get,
  getRemainingStomach,
  Macro,
  property,
  uneffect,
  withProperty,
} from "libram";
import { computeDiet, consumeDiet } from "./diet";
import { argmax, globalOptions, safeInterrupt, safeRestore } from "./lib";
import { garboValue, sessionSinceStart } from "./session";

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

  const bestItem = argmax(Array.from(itemChoices.keys()).map((i) => [i, garboValue(i)]));
  const bestChoice = itemChoices.get(bestItem);
  if (bestChoice && bestChoice > 0) {
    visitUrl("campground.php?action=workshed");
    runChoice(bestChoice);
  }
}

function horseradish(): void {
  if (getRemainingStomach() > 0 && !globalOptions.noDiet) {
    consumeDiet(computeDiet().pantsgiving(), "PANTSGIVING");
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

function juneCleave(): void {
  if (get("_juneCleaverFightsLeft") === 0) {
    equip($slot`weapon`, $item`June cleaver`);
    withProperty("recoveryScript", "", () => {
      adventureMacro($location`Noob Cave`, Macro.abort());
      if (["Poetic Justice", "Lost and Found"].includes(get("lastEncounter"))) {
        uneffect($effect`Beaten Up`);
      }
    });
  }
}

export default function postCombatActions(skipDiet = false): void {
  juneCleave();
  numberology();
  if (!skipDiet) horseradish();
  coldMedicineCabinet();
  safeInterrupt();
  safeRestore();
  updateMallPrices();
}
