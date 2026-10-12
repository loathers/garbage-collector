import { canAdventure, getMonsters, itemDropsArray, Location } from "kolmafia";
import { $item, $monster } from "libram";
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
      const ultraRareMonster = getMonsters(z).find((m) =>
        m.attributes.includes("ULTRARARE"),
      );

      return new WandererTarget({
        name: `UltraRare Monster ${ultraRareMonster}`,
        location: z,
        zoneValue:
          options.itemValue(
            itemDropsArray(ultraRareMonster ?? $monster.none)[0]?.drop ??
              $item.none,
          ) / 500_000_000, // Ultra rares are rare, let's say 1 in 500 million to be conservative
      });
    });
}
