import type { DraggableFight } from "./lib";

/** Expected supply before choosing destinations or reserving fights for projects. */
export type WandererSourceForecast = {
  name: string;
  type: DraggableFight;
  expectedFights: number;

  /** Probability that an encounter ends in a kill rather than a free run. */
  winChance: number;
};

/** A provider can jointly forecast several fight sources sharing resources. */
export type WandererSourceForecaster = (
  turns: number,
) => readonly WandererSourceForecast[];

type ForecastOverride<Resource extends string> = {
  resources: readonly Resource[];
  forecaster: WandererSourceForecaster;
};

type ResourceGroup<Resource extends string> = {
  resources: readonly [Resource, ...Resource[]];
  forecast: WandererSourceForecaster;
};

/**
 * Immutable forecast configuration. Each resource belongs to at most one override;
 * defaults supply resources that have no override. Resource names identify budgets,
 * such as a shared cooldown, rather than necessarily an item or a skill.
 */
export class WandererForecasters<Resource extends string> {
  private readonly defaults: ReadonlyMap<Resource, WandererSourceForecaster>;
  private readonly overrides: readonly ForecastOverride<Resource>[];

  private constructor(
    defaults: ReadonlyMap<Resource, WandererSourceForecaster>,
    overrides: readonly ForecastOverride<Resource>[] = [],
  ) {
    this.defaults = defaults;
    this.overrides = overrides;
  }

  /**
   * Create a configuration with optional defaults for its resource keys.
   * @param defaults Standalone forecasts for resources with a default policy
   * @returns A configuration that has not overridden any defaults
   */
  static fromDefaults<Resource extends string>(
    defaults: Readonly<Partial<Record<Resource, WandererSourceForecaster>>>,
  ): WandererForecasters<Resource> {
    return new WandererForecasters(
      new Map(
        Object.entries(defaults).filter(
          ([, forecaster]) => forecaster !== undefined,
        ) as [Resource, WandererSourceForecaster][],
      ),
    );
  }

  /**
   * Introduce one or more new resources and assign their forecast atomically.
   * A function covers all new resources. A group can also cover existing resources,
   * but must include every new key and cannot overlap another explicit assignment.
   * @param resources New resource name or nonempty list of new names
   * @param forecast Forecast function or an explicit group with its forecast
   * @returns A new configuration whose resource keys include the new names
   */
  withResource<const NewResource extends string>(
    resources: (NewResource | readonly [NewResource, ...NewResource[]]) &
      (Extract<NewResource, Resource> extends never ? unknown : never),
    forecast:
      | WandererSourceForecaster
      | ResourceGroup<Resource | NoInfer<NewResource>>,
  ): WandererForecasters<Resource | NewResource> {
    const added = [
      ...new Set(typeof resources === "string" ? [resources] : resources),
    ];
    if (added.length === 0) {
      throw new Error("At least one new resource must be declared.");
    }

    const known = new Set<string>([
      ...this.defaults.keys(),
      ...this.overrides.flatMap(({ resources }) => resources),
    ]);
    const existing = added.filter((resource) => known.has(resource));
    if (existing.length > 0) {
      throw new Error(`Resources already registered: ${existing.join(", ")}`);
    }

    const group =
      typeof forecast === "function"
        ? { resources: added, forecast }
        : forecast;
    const covered = new Set<string>(group.resources);
    const missing = added.filter((resource) => !covered.has(resource));
    if (missing.length > 0) {
      throw new Error(
        `Forecast group must include new resources: ${missing.join(", ")}`,
      );
    }

    return new WandererForecasters<Resource | NewResource>(
      this.defaults,
      this.overrides,
    ).assign(group.resources, group.forecast);
  }

  /**
   * Replace the providers for a group of resources with one joint forecast.
   * Throws if any resource already belongs to an override, including a joint one.
   * @param resources One or more budgets managed by this provider; defaults are optional
   * @param forecaster Joint forecast, evaluated once per call to forecast()
   * @returns A new configuration; this configuration is unchanged
   */
  override(
    resources: readonly [Resource, ...Resource[]],
    forecaster: WandererSourceForecaster,
  ): WandererForecasters<Resource> {
    return this.assign(resources, forecaster);
  }

  private assign(
    resources: readonly Resource[],
    forecaster: WandererSourceForecaster,
  ): WandererForecasters<Resource> {
    if (resources.length === 0) {
      throw new Error("A forecast override must own at least one resource.");
    }

    const group = [...new Set(resources)];
    const conflicts = group.filter((resource) =>
      this.overrides.some((override) => override.resources.includes(resource)),
    );
    if (conflicts.length > 0) {
      throw new Error(`Resources already overridden: ${conflicts.join(", ")}`);
    }

    return new WandererForecasters(this.defaults, [
      ...this.overrides,
      { resources: group, forecaster },
    ]);
  }

  /**
   * Evaluate each active provider once against current game state.
   * @param turnBudget Remaining turns in the caller's farming horizon
   * @returns Expected source supplies, before allocating destinations
   */
  forecast(turnBudget: number): WandererSourceForecast[] {
    const turns = Math.max(0, Math.floor(turnBudget));
    if (turns === 0) return [];

    const overridden = new Set(
      this.overrides.flatMap(({ resources }) => resources),
    );
    const forecasters = [
      ...[...this.defaults]
        .filter(([resource]) => !overridden.has(resource))
        .map(([, forecaster]) => forecaster),
      ...this.overrides.map(({ forecaster }) => forecaster),
    ];

    return forecasters
      .flatMap((forecaster) => forecaster(turns))
      .filter(({ expectedFights }) => expectedFights > 0);
  }
}

/**
 * Count uses of a recurring resource before the caller stops spending turns.
 * @param turns Remaining turns; the horizon is exclusive
 * @param first Turns until the resource is first available
 * @param cooldown Turns between subsequent uses
 * @returns Available uses, including a ready-now use when turns is positive
 */
export function cooldownUses(
  turns: number,
  first: number,
  cooldown: number,
): number {
  return Math.max(0, Math.ceil((turns - Math.max(0, first)) / cooldown));
}
