import { canAdventure, getMonsters, itemDropsArray, Location } from "kolmafia";
import { maxBy } from "libram";
import {
  DraggableFight,
  getAvailableUltraRareZones,
  WandererFactoryOptions,
  WandererTarget,
} from "./lib";

export function ultraRareFactory(
  type: DraggableFight,
  _locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  return getAvailableUltraRareZones()
    .filter((l) => canAdventure(l))
    .map((z) => {
      const ultraRareItemArray = itemDropsArray(
        getMonsters(z).filter((m) => m.attributes.includes("ULTRARARE"))[0],
      ).map((a) => a.drop);
      return new WandererTarget(
        `UltraRare ${z}`,
        z,
        ultraRareItemArray.length > 0
          ? options.itemValue(maxBy(ultraRareItemArray, options.itemValue)) /
            500000000
          : 0, // Ultra rares are rare, let's say 1 in 500 million to be conservative
      );
    });
}
