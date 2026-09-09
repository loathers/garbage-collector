import { Element, Location } from "kolmafia";
import {
  DraggableFight,
  WandererFactoryOptions,
  WandererTarget,
  wandererTurnsAvailableToday,
} from "./lib";
import {
  $effect,
  $element,
  $item,
  $location,
  BooleanProperty,
  get,
  have,
  NumericProperty,
} from "libram";

type PearlTarget = {
  location: Location;
  completionPref: BooleanProperty;
  progressPref: NumericProperty;
  estimatedProgress: number;
  maximizeElement: Element;
};
const PearlTargets: PearlTarget[] = [
  // estimating progress at some lower rates, 3.3 is with just passives.
  // TODO value resistances when targeting these, maybe make a pref or something that records our expected amount?
  {
    location: $location`The Briniest Deepests`,
    completionPref: "_unblemishedPearlTheBriniestDeepests",
    progressPref: "_unblemishedPearlTheBriniestDeepestsProgress",
    estimatedProgress: 3.3,
    maximizeElement: $element`Cold`,
  },
  {
    location: $location`Madness Reef`,
    completionPref: "_unblemishedPearlMadnessReef",
    progressPref: "_unblemishedPearlMadnessReefProgress",
    estimatedProgress: 3.3,
    maximizeElement: $element`Stench`,
  },
  {
    location: $location`Anemone Mine`,
    completionPref: "_unblemishedPearlAnemoneMine",
    progressPref: "_unblemishedPearlAnemoneMineProgress",
    estimatedProgress: 3.3,
    maximizeElement: $element`Spooky`,
  },
  {
    location: $location`The Dive Bar`,
    completionPref: "_unblemishedPearlDiveBar",
    progressPref: "_unblemishedPearlDiveBarProgress",
    estimatedProgress: 3.3,
    maximizeElement: $element`Sleaze`,
  },
  {
    location: $location`The Marinara Trench`,
    completionPref: "_unblemishedPearlMarinaraTrench",
    progressPref: "_unblemishedPearlMarinaraTrenchProgress",
    estimatedProgress: 3.3,
    maximizeElement: $element`Hot`,
  },
];

// We need to throw this to the maximizer somehow so that we properly value elemental bonuses
/* function elementalBonus(element: Element): number {
  const resistance = numericModifier(
    $modifier`${element.toString()} Resistance`
  );

  const progress = (resistance: number) =>
    Math.min(0.1, Math.max(0.017, 0.017 * Math.floor(resistance / 3)));

  const turns = (resistance: number) =>
    Math.ceil(1 / progress(resistance));

  return get("valueOfAdventure", 4000) * (turns(resistance) - turns(resistance + 1));
} */

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
