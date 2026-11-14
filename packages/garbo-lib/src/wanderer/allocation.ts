import type { Location } from "kolmafia";
import type { WandererSourceForecast } from "./forecasters";
import type { WandererFactoryOptions } from "./lib";

export type WandererAllocationContext = {
  options: WandererFactoryOptions;
  location: Location;
  /** Value of one encounter's project progress, before its completion gate. */
  value: number;
  locationSkiplist: Location[];
};

/**
 * Restrict compatible source forecasts to the fights a destination can attract.
 * Return adjusted forecasts without mutating the inputs or preparing destinations.
 * Keep win chances intact: availability applies them for projects requiring kills.
 */
export type WandererAllocator = (
  sources: WandererSourceForecast[],
  context: WandererAllocationContext,
) => WandererSourceForecast[];

/** Reserve yellow rays for item drops; count other compatible fights in full. */
export const defaultWandererAllocation: WandererAllocator = (sources) =>
  sources.filter((source) => source.type !== "yellow ray");
