import { booleanModifier, canEquip, Location, use } from "kolmafia";
import { $effect, $familiar, $item, $monster, get, have, questStep } from "libram";
import { waterBreathingEquipment } from "../outfit";
import { DraggableFight } from "../wanderer";
import { OutfitSpec } from "grimoire-kolmafia";
import { Macro } from "../combat";

export const embezzler = $monster`Knob Goblin Embezzler`;

/**
 * Configure the behavior of the fights in use in different parts of the fight engine
 * @interface EmbezzlerFightConfigOptions
 * @member {OutfitSpec} spec maximizer requirements to use for this fight (defaults to empty)
 * @member {draggableFight?} draggable if this fight can be pulled into another zone and what kind of draggable it is (defaults to undefined)
 * @member {boolean?} canInitializeWandererCounters if this fight can be used to initialize wanderers (defaults to false)
 * @member {boolean?} gregariousReplace if this is a "monster replacement" fight - pulls another monster from the CSV (defautls to false)
 * @member {boolean?} wrongEncounterName if mafia does not update the lastEncounter properly when doing this fight (defaults to value of gregariousReplace)
 */
export interface EmbezzlerFightConfigOptions {
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
}

export function checkUnderwater(): boolean {
  // first check to see if underwater even makes sense
  if (
    questStep("questS01OldGuy") >= 0 &&
    !(get("_envyfishEggUsed") || have($item`envyfish egg`)) &&
    (get("_garbo_weightChain", false) || !have($familiar`Pocket Professor`)) &&
    (booleanModifier("Adventure Underwater") ||
      waterBreathingEquipment.some((item) => have(item) && canEquip(item))) &&
    (have($effect`Fishy`) || (have($item`fishy pipe`) && !get("_fishyPipeUsed")))
  ) {
    if (!have($effect`Fishy`) && !get("_fishyPipeUsed")) use($item`fishy pipe`);

    return have($effect`Fishy`);
  }

  return false;
}
