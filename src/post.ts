import {
  cliExecute,
  descToItem,
  getWorkshed,
  Item,
  logprint,
  myAdventures,
  myLocation,
  reverseNumberology,
  runChoice,
  totalTurnsPlayed,
  visitUrl,
} from "kolmafia";
import { $item, $location, get, getRemainingStomach, property } from "libram";
import {
  AloeGuvnor,
  have,
  isFull,
  PitcherPlant,
  StealingMagnolia,
} from "libram/dist/resources/2013/Florist";
import { computeDiet, consumeDiet } from "./diet";
import { argmax, globalOptions, safeInterrupt, safeRestore } from "./lib";
import { garboValue, sessionSinceStart } from "./session";

function coldMedicineCabinet(): void {
  if (getWorkshed() !== $item`cold medicine cabinet`) return;
  logprint("DEBUG: garbo recognizes your workshed as the CMC.");

  if (
    property.getNumber("_coldMedicineConsults") >= 5 ||
    property.getNumber("_nextColdMedicineConsult") > totalTurnsPlayed()
  ) {
    return;
  }
  logprint("DEBUG: garbo plans to visit the cold medicine cabinet.");
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
  logprint(`DEBUG: garbo thinks the best item is ${bestItem}, with choice number ${bestChoice}.`);
  if (bestChoice && bestChoice > 0) {
    visitUrl("campground.php?action=workshed");
    runChoice(bestChoice);
  }
}

function floristFriars(): void {
  if (!have() || myLocation() !== $location`Barf Mountain` || isFull()) return;
  [StealingMagnolia, AloeGuvnor, PitcherPlant].forEach((flower) => flower.plant());
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

export default function postCombatActions(skipDiet = false): void {
  numberology();
  if (!skipDiet) horseradish();
  coldMedicineCabinet();
  floristFriars();
  safeInterrupt();
  safeRestore();
  updateMallPrices();
}
