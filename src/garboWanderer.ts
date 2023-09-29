import { Effect, Location } from "kolmafia";
import { globalOptions } from "./config";
import { freeFightFamiliarData } from "./familiar/freeFightFamiliar";
import { estimatedGarboTurns } from "./turns";
import { WandererManager } from "./wanderer";
import { $item, get } from "libram";
import { garboValue } from "./garboValue";
import { Potion } from "./potions";
import { embezzlerCount } from "./embezzler/fights";

let _wanderer: WandererManager | undefined;
export function wanderer(): WandererManager {
  if (!_wanderer) {
    _wanderer = new WandererManager({
      ascend: globalOptions.ascend,
      estimatedTurns: estimatedGarboTurns,
      itemValue: garboValue,
      effectValue: (effect: Effect, duration: number) =>
        new Potion($item.none, { effect, duration }).gross(embezzlerCount()),
      prioritizeCappingGuzzlr: get("garbo_prioritizeCappingGuzzlr", false),
      freeFightExtraValue: (location: Location) =>
        freeFightFamiliarData({ location }).expectedValue,
    });
  }
  return _wanderer;
}

export function digitizedMonstersRemaining(): number {
  return wanderer().digitizedMonstersRemaining();
}
