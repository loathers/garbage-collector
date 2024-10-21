import { Effect, getMonsters, Location } from "kolmafia";
import { WandererManager } from "garbo-lib";

import { globalOptions } from "./config";
import { freeFightFamiliarData } from "./familiar/freeFightFamiliar";
import { estimatedGarboTurns } from "./turns";
import { $item, $location, $monsters, get, have } from "libram";
import { garboValue } from "./garboValue";
import { Potion } from "./potions";
import { copyTargetCount } from "./target/fights";
import { digitizedMonstersRemainingForTurns } from "./lib";

type WandererMode = "free" | "target";
let _wanderer: WandererManager<WandererMode> | undefined;
export function wanderer(): WandererManager<WandererMode> {
  if (!_wanderer) {
    _wanderer = new WandererManager<WandererMode>({
      ascend: globalOptions.ascend,
      estimatedTurns: estimatedGarboTurns,
      itemValue: (_, item) => garboValue(item),
      effectValue: (_, effect: Effect, duration: number) =>
        new Potion($item.none, { effect, duration }).gross(copyTargetCount()),
      prioritizeCappingGuzzlr: get("garbo_prioritizeCappingGuzzlr", false),
      freeFightExtraValue: (_, location: Location) =>
        freeFightFamiliarData({ location }).expectedValue,
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
      slotCost: () => 0,
    });
  }
  return _wanderer;
}
