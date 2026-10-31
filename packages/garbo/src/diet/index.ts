import {
  cliExecute,
  equippedItem,
  fullnessLimit,
  inebrietyLimit,
  myClass,
  myFamiliar,
  myFullness,
  myInebriety,
  mySpleenUse,
  numericModifier,
  print,
  Slot,
  spleenLimit,
  use,
  useFamiliar,
} from "kolmafia";
import {
  $classes,
  $familiar,
  $item,
  $modifier,
  AsdonMartin,
  Diet,
  get,
  have,
  set,
  unequip,
} from "libram";
import { withVIPClan } from "../clan";
import { globalOptions } from "../config";
import { userConfirmDialog } from "../lib";
import { shrugBadEffects } from "../mood";
import { estimatedGarboTurns, estimatedTurnsTomorrow } from "../turns";
import { GarboWorkshed } from "../tasks/post/worksheds";
import { FarmingStrategy } from "../farmingStrategy";
import { computeDiet } from "./planning";
import { consumeDiet, printDiet } from "./consumption";
import { Note, switchingToMayo } from "./lib";
import { nonOrganAdventures } from "./nonOrgan";
export { bestConsumable, cheapestItem } from "./menu";
export { computeDiet } from "./planning";
export { consumeDiet } from "./consumption";
export { nonOrganAdventures } from "./nonOrgan";

function pillCheck(): void {
  if (!get("_distentionPillUsed")) {
    if (
      !get("garbo_skipPillCheck", false) &&
      !have($item`distention pill`, 1)
    ) {
      set(
        "garbo_skipPillCheck",
        userConfirmDialog(
          "You do not have any distention pills. Continue anyway? (Defaulting to no in 15 seconds)",
          false,
          15000,
        ),
      );
    }
  }

  if (!get("_syntheticDogHairPillUsed")) {
    if (
      !get("garbo_skipPillCheck", false) &&
      !have($item`synthetic dog hair pill`, 1)
    ) {
      set(
        "garbo_skipPillCheck",
        userConfirmDialog(
          "You do not have any synthetic dog hair pills. Continue anyway? (Defaulting to no in 15 seconds)",
          false,
          15000,
        ),
      );
    }
  }
}

export function runDiet(): void {
  withVIPClan(() => {
    // Strip organ capacity enhancers to avoid accidental overfilling.
    if (myFamiliar() === $familiar`Stooper`) {
      useFamiliar($familiar.none);
    }

    for (const slot of Slot.all()) {
      const item = equippedItem(slot);
      if (
        numericModifier(item, $modifier`stomach capacity`) ||
        numericModifier(item, $modifier`liver capacity`) ||
        numericModifier(item, $modifier`spleen capacity`)
      ) {
        unequip(slot);
      }
    }

    // Compute diet
    const dietBuilder = computeDiet();

    if (globalOptions.simdiet) {
      print("===== SIMULATED DIET =====");
      if (!get("_mimeArmyShotglassUsed") && have($item`mime army shotglass`)) {
        printDiet(dietBuilder.shotglass(), "SHOTGLASS");
      }
      printDiet(dietBuilder.diet(), "FULL");
    } else {
      if (switchingToMayo()) {
        if (
          GarboWorkshed.current?.workshed ===
          $item`Asdon Martin keyfob (on ring)`
        ) {
          AsdonMartin.drive(
            FarmingStrategy.asdonEffect,
            dietAdventures(dietBuilder.diet()) +
              (globalOptions.ascend ? 0 : estimatedTurnsTomorrow),
          );
        } else {
          GarboWorkshed.current?.action?.();
        }

        if (GarboWorkshed.useNext()?.workshed !== $item`portable Mayo Clinic`) {
          throw new Error("Failed to switch to portable Mayo clinic");
        }
      }
      pillCheck();

      nonOrganAdventures();

      if (have($item`astral six-pack`)) {
        use($item`astral six-pack`);
      }
      if (!get("_mimeArmyShotglassUsed") && have($item`mime army shotglass`)) {
        consumeDiet(dietBuilder.shotglass(), "SHOTGLASS");
      }

      if (
        get("barrelShrineUnlocked") &&
        !get("_barrelPrayer") &&
        $classes`Turtle Tamer, Accordion Thief`.includes(myClass())
      ) {
        cliExecute("barrelprayer buff");
      }

      consumeDiet(dietBuilder.diet(), "FULL");
      const organChecks = [
        { current: myInebriety, max: inebrietyLimit },
        { current: mySpleenUse, max: spleenLimit },
        { current: myFullness, max: fullnessLimit },
      ];
      if (organChecks.some(({ current, max }) => current() < max())) {
        throw new Error("Tried to fill our organs but couldn't!");
      }
      shrugBadEffects();
    }
  });
  globalOptions.dietCompleted = true;
}

function dietAdventures(diet: Diet<Note>): number {
  return Math.floor(estimatedGarboTurns(false) + diet.expectedAdventures());
}
