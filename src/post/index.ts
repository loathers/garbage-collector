import {
  cliExecute,
  equip,
  itemAmount,
  myAdventures,
  myLocation,
  reverseNumberology,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $skill,
  $slot,
  AutumnAton,
  FloristFriar,
  get,
  getRemainingStomach,
  have,
  JuneCleaver,
  uneffect,
  withProperty,
} from "libram";
import bestAutumnatonLocation from "./autumnaton";
import { garboAdventure, Macro } from "../combat";
import { globalOptions } from "../config";
import { computeDiet, consumeDiet } from "../diet";
import {
  bestJuneCleaverOption,
  juneCleaverChoiceValues,
  safeInterrupt,
  safeRestore,
  setChoice,
  valueJuneCleaverOption,
} from "../lib";
import { teleportEffects } from "../mood";
import { garboValue, sessionSinceStart } from "../session";
import { estimatedTurns } from "../turns";
import handleWorkshed from "./workshed";

function floristFriars(): void {
  if (!FloristFriar.have() || myLocation() !== $location`Barf Mountain` || FloristFriar.isFull()) {
    return;
  }
  [FloristFriar.StealingMagnolia, FloristFriar.AloeGuvnor, FloristFriar.PitcherPlant].forEach(
    (flower) => flower.plant()
  );
}

function fillPantsgivingFullness(): void {
  if (
    getRemainingStomach() > 0 &&
    (!globalOptions.prefs.yachtzeechain || get("_garboYachtzeeChainCompleted", false))
  ) {
    consumeDiet(computeDiet().pantsgiving(), "PANTSGIVING");
  }
}

function fillSweatyLiver(): void {
  if (globalOptions.prefs.yachtzeechain && !get("_garboYachtzeeChainCompleted", false)) return;

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

export default function postCombatActions(skipDiet = false): void {
  juneCleave();
  numberology();
  if (!skipDiet && !globalOptions.nodiet) {
    fillPantsgivingFullness();
    fillSweatyLiver();
  }
  floristFriars();
  handleWorkshed();
  safeInterrupt();
  safeRestore();
  updateMallPrices();
  stillsuit();
  if (globalOptions.ascend || AutumnAton.turnsForQuest() < estimatedTurns()) {
    AutumnAton.sendTo(bestAutumnatonLocation);
  }
}
