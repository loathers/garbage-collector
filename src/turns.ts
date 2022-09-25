import {
  fullnessLimit,
  inebrietyLimit,
  itemAmount,
  myAdventures,
  myFullness,
  myInebriety,
  myTurncount,
} from "kolmafia";
import { $familiar, $item, Counter, get, have, SourceTerminal } from "libram";
import { usingThumbRing } from "./dropsgear";
import { embezzlerCount } from "./embezzler";
import { ESTIMATED_OVERDRUNK_TURNS, globalOptions } from "./lib";

export function estimatedTurns(): number {
  // Assume roughly 2 fullness from pantsgiving and 8 adventures/fullness.
  const pantsgivingAdventures = have($item`Pantsgiving`)
    ? Math.max(0, 2 - get("_pantsgivingFullness")) * 8
    : 0;
  const potentialSausages =
    itemAmount($item`magical sausage`) + itemAmount($item`magical sausage casing`);
  const sausageAdventures = have($item`Kramco Sausage-o-Matic™`)
    ? Math.min(potentialSausages, 23 - get("_sausagesEaten"))
    : 0;
  const thesisAdventures = have($familiar`Pocket Professor`) && !get("_thesisDelivered") ? 11 : 0;
  const nightcapAdventures =
    globalOptions.ascending &&
    myInebriety() <= inebrietyLimit() &&
    have($item`Drunkula's wineglass`)
      ? ESTIMATED_OVERDRUNK_TURNS
      : 0;
  const thumbRingMultiplier = usingThumbRing() ? 1 / 0.96 : 1;

  // We need to estimate adventures from our organs if we are only dieting after yachtzee chaining
  const yachtzeeTurns = 30; // guesstimate
  const adventuresAfterChaining =
    globalOptions.yachtzeeChain && !get("_garboYachtzeeChainCompleted")
      ? Math.max(
          potentialFullnessAdventures() +
            potentialInebrietyAdventures() +
            potentialNonOrganAdventures() -
            yachtzeeTurns,
          0
        )
      : 0;

  let turns;
  if (globalOptions.stopTurncount) turns = globalOptions.stopTurncount - myTurncount();
  else if (globalOptions.noBarf) turns = embezzlerCount();
  else if (globalOptions.saveTurns > 0 || !globalOptions.ascending) {
    turns =
      (myAdventures() +
        sausageAdventures +
        pantsgivingAdventures +
        thesisAdventures +
        adventuresAfterChaining -
        globalOptions.saveTurns) *
      thumbRingMultiplier;
  } else {
    turns =
      (myAdventures() +
        sausageAdventures +
        pantsgivingAdventures +
        nightcapAdventures +
        thesisAdventures +
        adventuresAfterChaining) *
      thumbRingMultiplier;
  }

  return turns;
}

function untangleDigitizes(turnCount: number, chunks: number): number {
  const turnsPerChunk = turnCount / chunks;
  const monstersPerChunk = Math.sqrt((turnsPerChunk + 3) / 5 + 1 / 4) - 1 / 2;
  return Math.round(chunks * monstersPerChunk);
}

export function digitizedMonstersRemaining(): number {
  if (!SourceTerminal.have()) return 0;

  const digitizesLeft = SourceTerminal.getDigitizeUsesRemaining();
  if (digitizesLeft === SourceTerminal.getMaximumDigitizeUses()) {
    return untangleDigitizes(estimatedTurns(), SourceTerminal.getMaximumDigitizeUses());
  }

  const monsterCount = SourceTerminal.getDigitizeMonsterCount() + 1;

  const turnsLeftAtNextMonster = estimatedTurns() - Counter.get("Digitize Monster");
  if (turnsLeftAtNextMonster <= 0) return 0;
  const turnsAtLastDigitize = turnsLeftAtNextMonster + ((monsterCount + 1) * monsterCount * 5 - 3);
  return (
    untangleDigitizes(turnsAtLastDigitize, digitizesLeft + 1) -
    SourceTerminal.getDigitizeMonsterCount()
  );
}

function potentialFullnessAdventures(): number {
  const distentionPillSpace = have($item`distention pill`) && !get("_distentionPillUsed") ? 1 : 0;

  return (fullnessLimit() - myFullness() + distentionPillSpace) * 8;
}

function potentialInebrietyAdventures(): number {
  const syntheticPillSpace =
    have($item`synthetic dog hair pill`) && !get("_syntheticDogHairPillUsed") ? 1 : 0;
  const shotglassSpace = have($item`mime army shotglass`) && !get("_mimeArmyShotglassUsed") ? 1 : 0;
  const sweatSpace = have($item`designer sweatpants`) ? 3 - get("_sweatOutSomeBoozeUsed") : 0;

  return (inebrietyLimit() - myInebriety() + syntheticPillSpace + sweatSpace + shotglassSpace) * 7;
}

function potentialNonOrganAdventures(): number {
  const borrowedTimeAdventures = globalOptions.ascending && !get("_borrowedTimeUsed") ? 20 : 0;
  const chocolateAdventures = ((3 - get("_chocolatesUsed")) * (4 - get("_chocolatesUsed"))) / 2;
  const bufferAdventures = 30; // We don't know if garbo would decide to use melange/voraci tea/sweet tooth to get more adventures

  return borrowedTimeAdventures + chocolateAdventures + bufferAdventures;
}
