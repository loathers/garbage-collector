import {
  adv1,
  booleanModifier,
  canEquip,
  cliExecute,
  Location,
  myLocation,
  use,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  CrystalBall,
  get,
  have,
  questStep,
  withChoice,
  withChoices,
} from "libram";
import { DraggableFight } from "garbo-lib";
import { OutfitSpec } from "grimoire-kolmafia";

import { waterBreathingEquipment } from "../outfit";
import { Macro } from "../combat";
import { globalOptions } from "../config";
import { freeFishyAvailable } from "../lib";
import { willYachtzee } from "../resources";

/**
 * Configure the behavior of the fights in use in different parts of the fight engine
 * @interface TargetFightConfigOptions
 * @member {OutfitSpec} spec maximizer requirements to use for this fight (defaults to empty)
 * @member {draggableFight?} draggable if this fight can be pulled into another zone and what kind of draggable it is (defaults to undefined)
 * @member {boolean?} canInitializeWandererCounters if this fight can be used to initialize wanderers (defaults to false)
 * @member {boolean?} gregariousReplace if this is a "monster replacement" fight - pulls another monster from the CSV (defautls to false)
 * @member {boolean?} wrongEncounterName if mafia does not update the lastEncounter properly when doing this fight (defaults to value of gregariousReplace)
 */
export interface TargetFightConfigOptions {
  spec?: OutfitSpec;
  draggable?: DraggableFight;
  canInitializeWandererCounters?: boolean;
  wrongEncounterName?: boolean;
  gregariousReplace?: boolean;
  location?: Location;
}

export interface RunOptions {
  macro: Macro;
  location: Location;
  useAuto: boolean;
  action: string;
}

export function checkUnderwater(): boolean {
  // first check to see if underwater even makes sense
  if (
    questStep("questS01OldGuy") >= 0 &&
    !(get("_envyfishEggUsed") || have($item`envyfish egg`)) &&
    (get("_garbo_weightChain", false) || !have($familiar`Pocket Professor`)) &&
    (booleanModifier("Adventure Underwater") ||
      waterBreathingEquipment.some((item) => have(item) && canEquip(item))) &&
    freeFishyAvailable() &&
    !willYachtzee()
  ) {
    if (
      !have($effect`Fishy`) &&
      have($item`fishy pipe`) &&
      !get("_fishyPipeUsed")
    ) {
      use($item`fishy pipe`);
    }
    if (
      !have($effect`Fishy`) &&
      get("skateParkStatus") === "ice" &&
      !get("_skateBuff1")
    ) {
      cliExecute("skate lutz");
    }

    return have($effect`Fishy`);
  }

  return false;
}

type ChangeLastAdvLocationMethod = "hiddencity" | "dailydungeon";
export function getChangeLastAdvLocationMethod(): ChangeLastAdvLocationMethod {
  if (questStep("questL11Worship") > 3) {
    return "hiddencity";
  } else {
    return "dailydungeon";
  }
}

// for now, return a psuedo task since target fights are not grimoirized
export function changeLastAdvLocationTask(): {
  ready: () => boolean;
  completed: () => boolean;
  do: () => void;
} {
  const base = {
    ready: () =>
      CrystalBall.ponder().get($location`The Dire Warren`) !==
      globalOptions.target,
    completed: () => myLocation() !== $location`The Dire Warren`,
  };
  switch (getChangeLastAdvLocationMethod()) {
    case "hiddencity":
      return {
        ...base,
        do: () =>
          withChoice(785, 6, () =>
            adv1($location`An Overgrown Shrine (Northeast)`, -1, ""),
          ),
      };
    case "dailydungeon":
      return {
        ...base,
        do: () =>
          // at this point, we're either at an NC we can walk away from or the whole DD is done
          // only track the choices we need to walk away since hitting it when it is done does nothing
          withChoices({ 692: 8, 693: 3 }, () =>
            adv1($location`The Daily Dungeon`, -1, ""),
          ),
      };
  }
}
