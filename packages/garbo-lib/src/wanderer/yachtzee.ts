import { Location } from "kolmafia";
import { $effect, $location, get, have, realmAvailable } from "libram";
import {
  DraggableFight,
  WandererFactoryOptions,
  WandererTarget,
  wandererTurnsAvailableToday,
} from "./lib";

export function yachtzeeFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (
    realmAvailable("sleaze") &&
    have($effect`Fishy`) &&
    get("encountersUntilYachtzeeChoice") > 0 &&
    [
      "backup",
      "wanderer",
      "yellow ray",
      "freefight",
      "freerun",
      "conditional freefight",
      "freefight (no items)",
    ].includes(type) &&
    !locationSkiplist.includes($location`The Sunken Party Yacht`)
  ) {
    const canFinishDelay =
      wandererTurnsAvailableToday(
        // Collecting Yachtzee costs a paid turn after finishing the countdown.
        { ...options, estimatedTurns: () => options.estimatedTurns() - 1 },
        $location`The Sunken Party Yacht`,
        false,
      ) >= get("encountersUntilYachtzeeChoice");

    return [
      new WandererTarget({
        name: "Yachtzee Countdown",
        location: $location`The Sunken Party Yacht`,
        // End-of-day NC forcers reset this progress even when we aren't ascending.
        zoneValue: canFinishDelay ? (20000 - get("valueOfAdventure")) / 19 : 0,
      }),
    ];
  }
  return [];
}
