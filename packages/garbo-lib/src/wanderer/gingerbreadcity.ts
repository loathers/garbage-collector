import { availableAmount, haveOutfit, Location } from "kolmafia";
import {
  DraggableFight,
  WandererFactoryOptions,
  WandererTarget,
  wandererTurnsAvailableToday,
} from "./lib";
import { $item, $location, GingerBread } from "libram";

export function gingerbreadFactory(
  type: DraggableFight,
  _locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (
    type !== "wanderer" &&
    GingerBread.available() &&
    GingerBread.minutesToMidnight() !== 0 &&
    GingerBread.minutesToNoon() !== 0 &&
    ((GingerBread.minutesToMidnight() > 0 &&
      (availableAmount($item`sprinkles`) > 5 ||
        haveOutfit("gingerbread best"))) ||
      GingerBread.minutesToNoon() > 0)
  ) {
    const turnsUntilNextNC =
      GingerBread.minutesToNoon() > 0
        ? GingerBread.minutesToNoon()
        : GingerBread.minutesToMidnight();
    return [
      new WandererTarget(
        "Gingerbread Minutes",
        $location`Gingerbread Civic Center`,
        // 50 value is arbitrary until we have proper valuation of our options from Midnight and Noons NCs
        wandererTurnsAvailableToday(
          options,
          $location`Gingerbread Civic Center`,
          false,
        ) > turnsUntilNextNC
          ? 50
          : 0,
      ),
    ];
  }
  return [];
}
