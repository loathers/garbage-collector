import { Location, Monster } from "kolmafia";
import { WanderDetails, WandererManager } from "garbo-lib";

import { globalOptions } from "./config";
import { freeFightFamiliarData } from "./familiar/freeFightFamiliar";
import { estimatedGarboTurns } from "./turns";
import {
  $item,
  $location,
  $monsters,
  AdventureTarget,
  BloodCubicZirconia,
  get,
  have,
  SourceTerminal,
} from "libram";
import { garboValue } from "./garboValue";
import { effectValueWithOpportunityCost } from "./potions";
import { safeRefractedCasts } from "./resources/bloodCubicZirconia";
import { FarmingStrategy } from "./farmingStrategy";

let _wanderer: WandererManager | undefined;
export function wanderer(): WandererManager {
  if (!_wanderer) {
    _wanderer = new WandererManager({
      ascend: globalOptions.ascend,
      estimatedTurns: estimatedGarboTurns,
      itemValue: garboValue,
      effectValue: effectValueWithOpportunityCost,
      prioritizeCappingGuzzlr: get("garbo_prioritizeCappingGuzzlr", false),
      freeFightExtraValue: (location: Location) =>
        freeFightFamiliarData(location).expectedValue,
      digitzesRemaining: SourceTerminal.digitizedMonstersRemainingForTurns,
      plentifulMonsters: [
        globalOptions.target,
        ...(globalOptions.nobarf ? [] : FarmingStrategy.monsters()),
        ...(have($item`Kramco Sausage-o-Matic™`)
          ? $monsters`sausage goblin`
          : []),
      ],
      valueOfAdventure: get("valueOfAdventure"),
      takeTurnForProfit: true,
      canRefractedGaze: BloodCubicZirconia.have() && safeRefractedCasts() > 0,
      underwaterAllowed: FarmingStrategy.isUnderwater(),
    });
  }
  return _wanderer;
}

type WanderResult = ReturnType<WandererManager["resolveTarget"]>;
type Destination = Location | WanderDetails | WanderResult;
export type Adventure = {
  target: AdventureTarget;
  location: Location;
  wanderTarget?: WanderResult;
};
export type AdventureArgument =
  | Monster
  | Destination
  | { target: AdventureTarget; location: Destination };
export function toAdventure(arg: AdventureArgument): Adventure {
  if (arg instanceof Monster) return { target: arg, location: $location.none };
  if (arg instanceof Location) return { target: arg, location: arg };
  if (typeof arg !== "string" && "peridotMonster" in arg) {
    return { target: arg.location, location: arg.location, wanderTarget: arg };
  }
  if (typeof arg === "string" || !("target" in arg)) {
    const wanderTarget = wanderer().getTarget(arg);
    return {
      target: wanderTarget.location,
      location: wanderTarget.location,
      wanderTarget,
    };
  }
  return { ...toAdventure(arg.location), target: arg.target };
}
