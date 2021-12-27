import {
  descToItem,
  getWorkshed,
  mallPrice,
  runChoice,
  totalTurnsPlayed,
  visitUrl,
} from "kolmafia";
import { $item, getRemainingStomach, property } from "libram";
import { computeDiet, consumeDiet } from "./diet";
import { argmax, globalOptions, safeInterrupt, safeRestore } from "./lib";

function coldMedicineCabinet(): void {
  if (getWorkshed() !== $item`cold medicine cabinet`) return;
  if (
    property.getNumber("_coldMedicineConsults") >= 5 ||
    property.getNumber("_nextColdMedicineConsult") > totalTurnsPlayed()
  )
    return;
  const options = visitUrl("campground.php?action=workshed");
  let i = 0;
  let match;
  const regexp = /descitem\((\d+)\)/g;
  const itemChoices = new Map<Item, number>();

  while ((match = regexp.exec(options)) !== null) {
    i++;
    const item = descToItem(match[1]);
    itemChoices.set(item, i);
  }

  const bestItem = argmax(Array.from(itemChoices.keys()).map((i) => [i, mallPrice(i)]));
  const bestChoice = itemChoices.get(bestItem);
  if (bestChoice) {
    visitUrl("campground.php?action=workshed");
    runChoice(bestChoice);
  }
}

function horseradish(): void {
  if (getRemainingStomach() > 0 && !globalOptions.noDiet) {
    consumeDiet(computeDiet().pantsgiving());
  }
}

export default function postCombatActions(skipDiet = false): void {
  if (!skipDiet) horseradish();
  coldMedicineCabinet();
  safeInterrupt();
  safeRestore();
}
