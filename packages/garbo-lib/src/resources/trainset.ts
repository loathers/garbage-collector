import { Item, myAdventures, visitUrl } from "kolmafia";
import {
  $items,
  arrayEquals,
  Delayed,
  get,
  maxBy,
  set,
  sumNumbers,
  TrainSet,
  undelay,
} from "libram";
import { DEFAULT_VALUE_FUNCTIONS } from "./lib";

const CANDY_FACTORY_DROPS = $items`cotton candy bale, cotton candy cone, cotton candy pillow, cotton candy pinch, cotton candy plug, cotton candy skoshe, cotton candy smidgen, crazy little Turkish delight, Daffy Taffy, Elvish delight, explosion-flavored chewing gum, green candy heart, green gummi ingot, gummi canary, gummi salamander, gummi snake, Gummi-Gnauga, honey stick, honey-dipped locust, jabañero-flavored chewing gum, lavender candy heart, lime-and-chile-flavored chewing gum, marzipan skull, Mr. Mediocrebar, orange candy heart, pack of chewing gum, pickle-flavored chewing gum, Piddles, pile of candy, pink candy heart, pixellated candy heart, Polka Pop, red gummi ingot, Rock Pops, Senior Mints, Steal This Candy, Sugar Cog, sugar shard, tamarind-flavored chewing gum, Tasty Fun Good rice candy, white candy heart, white chocolate chips, Wint-O-Fresh mint, yellow candy heart, yellow gummi ingot, Yummy Tummy bean`;

export type TrainSetOptions = {
  averageItemValue?: (...items: Item[]) => number;
  stationValues?: Map<TrainSet.Station, Delayed<number>>;
  ascend?: boolean;
  estimatedTurns?: () => number;
};

type TrainPlan = {
  cycle: TrainSet.Cycle;
  extraStations: number;
};

/**
 * Station values are sampled once per manager. Overrides only affect the five
 * item/Meat stations, fizzy water, and the viewing platform.
 */
export class TrainSetManager {
  private readonly stationValues: Map<TrainSet.Station, Delayed<number>>;
  private readonly ascend: boolean;
  private readonly estimatedTurns: () => number;
  private plan?: TrainPlan;

  constructor({
    averageItemValue = DEFAULT_VALUE_FUNCTIONS.averageValue,
    stationValues = new Map(),
    ascend = false,
    estimatedTurns = myAdventures,
  }: TrainSetOptions = {}) {
    this.ascend = ascend;
    this.estimatedTurns = estimatedTurns;
    this.stationValues = new Map<TrainSet.Station, Delayed<number>>([
      [TrainSet.Station.GAIN_MEAT, 900],
      [
        TrainSet.Station.TRACKSIDE_DINER,
        () =>
          averageItemValue(
            ...$items`bowl of cottage cheese, hot buttered roll, toast`,
          ),
      ],
      [
        TrainSet.Station.CANDY_FACTORY,
        () => averageItemValue(...CANDY_FACTORY_DROPS),
      ],
      [
        TrainSet.Station.GRAIN_SILO,
        () =>
          2 *
          averageItemValue(
            ...$items`bottle of gin, bottle of vodka, bottle of whiskey, bottle of rum, bottle of tequila, boxed wine`,
          ),
      ],
      [
        TrainSet.Station.ORE_HOPPER,
        () =>
          averageItemValue(
            ...$items`linoleum ore, asbestos ore, chrome ore, teflon ore, vinyl ore, velcro ore, bubblewrap ore, cardboard ore, styrofoam ore`,
          ),
      ],
      [TrainSet.Station.TOWER_FIZZY, 0],
      [TrainSet.Station.VIEWING_PLATFORM, 0],
      ...stationValues,
    ]);
  }

  private getPlan(): TrainPlan {
    if (this.plan) return this.plan;

    const stations = [
      TrainSet.Station.GAIN_MEAT,
      TrainSet.Station.TRACKSIDE_DINER,
      TrainSet.Station.CANDY_FACTORY,
      TrainSet.Station.GRAIN_SILO,
      TrainSet.Station.ORE_HOPPER,
    ].map((station) => ({
      station,
      value: undelay(this.stationValues.get(station) ?? 0),
    }));
    stations.sort((a, b) => b.value - a.value);

    const cycle = [
      TrainSet.Station.COAL_HOPPER,
      ...stations.map(({ station }) => station),
      TrainSet.Station.TOWER_FIZZY,
      TrainSet.Station.VIEWING_PLATFORM,
    ] as TrainSet.Cycle;
    const values = [
      // Every candidate prefix includes coal and the reward it doubles.
      stations[0].value,
      ...stations.map(({ value }) => value),
      undelay(this.stationValues.get(TrainSet.Station.TOWER_FIZZY) ?? 0),
      undelay(this.stationValues.get(TrainSet.Station.VIEWING_PLATFORM) ?? 0),
    ];
    const firstFortyCombats = 5 * sumNumbers(values);
    const extraStations = maxBy(
      [2, 3, 4, 5, 6, 7, 8],
      (count) =>
        (firstFortyCombats + sumNumbers(values.slice(0, count))) / (40 + count),
    );
    this.plan = { cycle, extraStations };
    return this.plan;
  }

  private getRotatedCycle(): TrainSet.Cycle {
    const offset = get("trainsetPosition") % 8;
    const { cycle } = this.getPlan();
    const pieces = [...cycle] as TrainSet.Cycle;
    cycle.forEach((station, index) => {
      pieces[(index + offset) % 8] = station;
    });
    return pieces;
  }

  needsRotating(): boolean {
    if (!TrainSet.canConfigure()) return false;
    if (!get("trainsetConfiguration")) {
      visitUrl("campground.php?action=workshed");
      visitUrl("main.php");
    }

    if (!get("trainsetConfiguration")) return true;
    if (arrayEquals(this.getRotatedCycle(), TrainSet.cycle())) return false;
    if (this.ascend && this.estimatedTurns() <= 40) return false;
    const { cycle, extraStations } = this.getPlan();
    return !cycle.slice(0, extraStations).includes(TrainSet.next());
  }

  rotateToOptimalCycle(): boolean {
    const hasRotated = TrainSet.setConfiguration(this.getRotatedCycle());

    // If KoL disagrees with the tracked cooldown, retry after one train advance.
    if (!hasRotated && TrainSet.canConfigure()) {
      set("lastTrainsetConfiguration", get("trainsetPosition") - 39);
    }
    return hasRotated;
  }
}
