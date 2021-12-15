import {
  descToItem,
  eat,
  fullnessLimit,
  getWorkshed,
  mallPrice,
  myFullness,
  runChoice,
  totalTurnsPlayed,
  visitUrl,
} from "kolmafia";
import { $item, get, MayoClinic, property } from "libram";
import { acquire } from "./acquire";
import { argmax, safeInterrupt, safeRestore } from "./lib";

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
  if (myFullness() < fullnessLimit()) {
    if (mallPrice($item`fudge spork`) < 3 * get("valueOfAdventure") && !get("_fudgeSporkUsed"))
      eat(1, $item`fudge spork`);
    MayoClinic.setMayoMinder(MayoClinic.Mayo.zapine, 1);
    acquire(1, $item`Special Seasoning`, get("valueOfAdventure"));
    acquire(1, $item`jumping horseradish`, 5.5 * get("valueOfAdventure"));
    if (!eat(1, $item`jumping horseradish`)) throw "Failed to eat safely";
  }
}

export function postCombatActions(skipDiet = false): void {
  if (!skipDiet) horseradish();
  coldMedicineCabinet();
  safeInterrupt();
  safeRestore();
}
