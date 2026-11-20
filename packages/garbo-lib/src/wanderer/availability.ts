import { Location } from "kolmafia";
import { sum } from "libram";
import {
  canWander,
  DraggableFight,
  draggableFights,
  WandererFactoryOptions,
} from "./lib";
import { defaultForecasters } from "./forecast";
import { defaultWandererAllocation } from "./allocation";

/**
 * Expected compatible encounters after accounting for competing destinations.
 * Kill-based projects receive only the winning fraction of conditional fights.
 * @param options Caller forecasts and location constraints
 * @param location Destination whose encounter eligibility should be checked
 * @param requiresMonsterKill Whether free runs fail to advance this project
 * @param project The project's value before its completion gate and compatible fight types
 * @returns Expected available progress encounters in the caller's horizon
 */
export function wandererTurnsAvailableToday(
  options: WandererFactoryOptions,
  location: Location,
  requiresMonsterKill: boolean,
  {
    value = 0,
    types = draggableFights,
    locationSkiplist = [],
  }: {
    value?: number;
    types?: readonly DraggableFight[];
    locationSkiplist?: Location[];
  } = {},
): number {
  const turns = Math.max(0, Math.floor(options.estimatedTurns()));
  const forecasters = options.wandererSources ?? defaultForecasters;

  const sources = forecasters
    .forecast(turns)
    .filter(
      (source) =>
        types.includes(source.type) &&
        canWander(location, source.type, options.underwaterAllowed),
    );
  const allocate = options.wandererAllocation ?? defaultWandererAllocation;
  const allocated = allocate(sources, {
    options,
    location,
    value,
    locationSkiplist,
  });

  return sum(
    allocated,
    (source) =>
      source.expectedFights * (requiresMonsterKill ? source.winChance : 1),
  );
}
