import { Location } from "kolmafia";
import {
  DraggableFight,
  WandererFactoryOptions,
  WandererTarget,
  wandererTurnsAvailableToday,
} from "./lib";
import { $effect, $item, $location, get, have } from "libram";

type PearlTarget = {
  location: Location;
  completionPref: string;
  progressPref: string;
  estimatedProgress: number;
};
const PearlTargets: PearlTarget[] = [
  // estimating progress at some lower rates, 3.3 is with just passives.
  // TODO value resistances when targeting these, maybe make a pref or something that records our expected amount?
  {
    location: $location`The Briniest Deepests`,
    completionPref: "_unblemishedPearlTheBriniestDeepests",
    progressPref: "_unblemishedPearlTheBriniestDeepestsProgress",
    estimatedProgress: 3.3,
  },
  {
    location: $location`Madness Reef`,
    completionPref: "_unblemishedPearlMadnessReef",
    progressPref: "_unblemishedPearlMadnessReefProgress",
    estimatedProgress: 3.3,
  },
  {
    location: $location`Anemone Mine`,
    completionPref: "_unblemishedPearlAnemoneMine",
    progressPref: "_unblemishedPearlAnemoneMineProgress",
    estimatedProgress: 3.3,
  },
  {
    location: $location`The Dive Bar`,
    completionPref: "_unblemishedPearlDiveBar",
    progressPref: "_unblemishedPearlDiveBarProgress",
    estimatedProgress: 3.3,
  },
  {
    location: $location`The Marinara Trench`,
    completionPref: "_unblemishedPearlMarinaraTrench",
    progressPref: "_unblemishedPearlMarinaraTrenchProgress",
    estimatedProgress: 3.3,
  },
];

function turnsRemainingToComplete(
  progressPref: string,
  estimatedProgress: number,
) {
  const progressRemaining = 100 - get(progressPref, 0);
  return Math.ceil(progressRemaining / estimatedProgress);
}

export function pearlFactory(
  type: DraggableFight,
  _locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (have($effect`Fishy`) && type !== "freerun") {
    return PearlTargets.filter(
      (t) =>
        !get(t.completionPref) &&
        wandererTurnsAvailableToday(options, t.location, true) >=
          turnsRemainingToComplete(t.progressPref, t.estimatedProgress),
    ).map(
      (t) =>
        new WandererTarget({
          name: `${t.location} Pearl`,
          location: t.location,
          zoneValue:
            options.itemValue($item`unblemished pearl`) *
            (t.estimatedProgress / 100),
        }),
    );
  }
  return [];
}
