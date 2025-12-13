import { getMonsters, Location } from "kolmafia";
import { WandererManager } from "garbo-lib";

import { globalOptions } from "./config";
import { freeFightFamiliarData } from "./familiar/freeFightFamiliar";
import { estimatedGarboTurns } from "./turns";
import { $item, $location, $monsters, get, have } from "libram";
import { garboValue } from "./garboValue";
import { effectValue } from "./potions";
import { digitizedMonstersRemainingForTurns } from "./lib";

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
    });
  }
  return _wanderer;
}
