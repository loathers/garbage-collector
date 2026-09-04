import { abort, haveEffect, useSkill } from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $skill,
  get,
  have,
  withChoice,
} from "libram";
import { copyTargetCount } from "../target";
import { FarmingStrategy } from "../farmingStrategy";

export function waveDireWarren() {
  if (
    FarmingStrategy.isUnderwater() &&
    have($item`Monodent of the Sea`) &&
    haveEffect($effect`Fishy`) > copyTargetCount() + 50 && // Let's be very careful
    !get("_seadentWaveUsed") &&
    get("_seadentWaveZone") !== "The Dire Warren" &&
    get("lastAdventure") === $location`The Dire Warren`
  ) {
    withChoice(1566, 1, () => {
      useSkill($skill`Sea *dent: Summon a Wave`);
    });
    if (get("_seadentWaveZone") !== "The Dire Warren") {
      abort("Something went wrong while waving Dire Warren");
    }
  }
}
