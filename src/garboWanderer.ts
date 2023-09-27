import { Location } from "kolmafia";
import { globalOptions } from "./config";
import { freeFightFamiliarData } from "./familiar/freeFightFamiliar";
import { estimatedGarboTurns } from "./turns";
import { garboValue } from "./value";
import { WandererManager } from "./wanderer";
import { get } from "libram";

let _wanderer: WandererManager | undefined;
export function wanderer(): WandererManager {
  if (!_wanderer) {
    _wanderer = new WandererManager({
      ascend: globalOptions.ascend,
      getEstimatedRemainingTurns: estimatedGarboTurns,
      itemValue: garboValue,
      effectValue: () => 0,
      prioritizeCappingGuzzlr: get("garbo_prioritizeCappingGuzzlr", false),
      getFreeFightValue: (location: Location) => freeFightFamiliarData({ location }).expectedValue,
    });
  }
  return _wanderer;
}
