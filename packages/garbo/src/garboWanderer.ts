import { getMonsters, Location, Monster } from "kolmafia";
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
} from "libram";
import { garboValue } from "./garboValue";
import { effectValue } from "./potions";
import { digitizedMonstersRemainingForTurns } from "./lib";
import { safeRefractedCasts } from "./resources";

let _wanderer: WandererManager | undefined;
export function wanderer(): WandererManager {
  if (!_wanderer) {
    _wanderer = new WandererManager({
      ascend: globalOptions.ascend,
      estimatedTurns: estimatedGarboTurns,
      itemValue: garboValue,
      effectValue,
      prioritizeCappingGuzzlr: get("garbo_prioritizeCappingGuzzlr", false),
      freeFightExtraValue: (location: Location) =>
        freeFightFamiliarData(location).expectedValue,
      digitzesRemaining: digitizedMonstersRemainingForTurns,
      plentifulMonsters: [
        globalOptions.target,
        ...(globalOptions.nobarf ? [] : getMonsters($location`Barf Mountain`)),
        ...(have($item`Kramco Sausage-o-Matic™`)
          ? $monsters`sausage goblin`
          : []),
      ],
      valueOfAdventure: get("valueOfAdventure"),
      takeTurnForProfit: true,
      canRefractedGaze: BloodCubicZirconia.have() && safeRefractedCasts() > 0,
    });
  }
  return _wanderer;
}

export type Destination = Location | WanderDetails;
export const destinationToLocation = (destination: Destination): Location =>
  destination instanceof Location
    ? destination
    : wanderer().getTarget(destination).location;
export type Adventure = { target: AdventureTarget; location: Location };
export type AdventureArgument =
  | Monster
  | Destination
  | { target: Monster; location: Destination };
export function toAdventure(arg: AdventureArgument): Adventure {
  if (arg instanceof Monster) return { target: arg, location: $location.none };
  if (arg instanceof Location) return { target: arg, location: arg };
  if (typeof arg === "string" || !("target" in arg)) {
    const location = wanderer().getTarget(arg).location;
    return { target: location, location };
  }
  return { target: arg.target, location: destinationToLocation(arg.location) };
}
