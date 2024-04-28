import { availableAmount, haveOutfit, Location } from "kolmafia";
import { DraggableFight, WandererFactoryOptions, WandererTarget } from "./lib";
import { $item, $location, GingerBread } from "libram";

export function gingerbreadFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (
    ["freefight", "freerun"].includes(type) &&
    !locationSkiplist.some((loc) => GingerBread.LOCATIONS.includes(loc)) &&
    GingerBread.available() &&
    GingerBread.minutesToMidnight() !== 0 &&
    GingerBread.minutesToNoon() !== 0 &&
    ((GingerBread.minutesToMidnight() > 0 &&
      (availableAmount($item`sprinkles`) > 5 ||
        haveOutfit("gingerbread best"))) ||
      GingerBread.minutesToNoon() > 0)
  ) {
    return [
      new WandererTarget(
        "Gingerbread Minutes",
        $location`Gingerbread Civic Center`,
        // Arbitrary cutoff, where it's unlikely we'll reach the next NC. 50 value is also arbitrary, just to put it above default
        options.estimatedTurns() < 100 ? 0 : 50,
      ),
    ];
  }
  return [];
}
