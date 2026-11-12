import { Location } from "kolmafia";
import { sum } from "libram";
import {
  canWander,
  DraggableFight,
  draggableFights,
  WandererFactoryOptions,
} from "./lib";
import { defaultForecasters } from "./forecast";

/**
 * Expected compatible encounters, before allocating them between destinations.
 * Kill-based projects receive only the winning fraction of conditional fights.
 * @param options Caller forecasts and location constraints
 * @param location Destination whose encounter eligibility should be checked
 * @param requiresMonsterKill Whether free runs fail to advance this project
 * @param types Fight types that can advance this project
 * @returns Expected available progress encounters in the caller's horizon
 */
export function wandererTurnsAvailableToday(
  options: WandererFactoryOptions,
  location: Location,
  requiresMonsterKill: boolean,
  types: readonly DraggableFight[] = draggableFights,
): number {
  const turns = Math.max(0, Math.floor(options.estimatedTurns()));
  const forecasters = options.wandererSources ?? defaultForecasters;

  return sum(forecasters.forecast(turns), (source) =>
    types.includes(source.type) &&
    canWander(location, source.type, options.underwaterAllowed)
      ? source.expectedFights * (requiresMonsterKill ? source.winChance : 1)
      : 0,
  );
}
