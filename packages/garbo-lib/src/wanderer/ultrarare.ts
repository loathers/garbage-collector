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
    .map(
      (z) =>
        new WandererTarget(
          `UltraRare ${z}`,
          z,
          options.itemValue(
            maxBy(
              itemDropsArray(
                getMonsters(z).filter((m) =>
                  m.attributes.includes("ULTRARARE"),
                )[0],
              ).map((a) => a.drop),
              options.itemValue,
            ),
          ) / 500000000, // Ultra rares are rare, let's say 1 in 500 million to be conservative,
          0,
        ),
    );
}
