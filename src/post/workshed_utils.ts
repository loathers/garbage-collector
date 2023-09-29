import {
  descToItem,
  fileToBuffer,
  handlingChoice,
  Item,
  runChoice,
  toItem,
  visitUrl,
} from "kolmafia";
import { $item, $items, get, maxBy, set, sum, TrainSet } from "libram";
import { globalOptions } from "../config";
import { GarboItemLists, today } from "../lib";
import { garboAverageValue, garboValue } from "../garboValue";

function candyFactoryValue(): number {
  const lastCalculated = get("garbo_candyFactoryValueDate", 0);
  if (!get("garbo_candyFactoryValue", 0) || today - lastCalculated > 7 * 24 * 60 * 60 * 1000) {
    const candyFactoryDrops = (JSON.parse(fileToBuffer("garbo_item_lists.json")) as GarboItemLists)[
      "trainset"
    ];
    const averageDropValue =
      sum(candyFactoryDrops, (name) => garboValue(toItem(name), true)) / candyFactoryDrops.length;
    set("garbo_candyFactoryValue", averageDropValue);
    set("garbo_candyFactoryValueDate", today);
  }
  return get("garbo_candyFactoryValue", 0);
}

const GOOD_TRAIN_STATIONS = [
  { piece: TrainSet.Station.GAIN_MEAT, value: () => 900 },
  {
    // Some day this'll be better
    piece: TrainSet.Station.TRACKSIDE_DINER,
    value: () => garboAverageValue(...$items`bowl of cottage cheese, hot buttered roll, toast`),
  },
  { piece: TrainSet.Station.CANDY_FACTORY, value: candyFactoryValue },
  {
    piece: TrainSet.Station.GRAIN_SILO,
    value: () =>
      2 *
      garboAverageValue(
        ...$items`bottle of gin, bottle of vodka, bottle of whiskey, bottle of rum, bottle of tequila, boxed wine`,
      ),
  },
  {
    piece: TrainSet.Station.ORE_HOPPER,
    value: () =>
      garboAverageValue(
        ...$items`linoleum ore, asbestos ore, chrome ore, teflon ore, vinyl ore, velcro ore, bubblewrap ore, cardboard ore, styrofoam ore`,
      ),
  },
];

let trainCycle: TrainSet.Cycle;
function getBestCycle(): TrainSet.Cycle {
  if (!trainCycle) {
    const cycle = [
      TrainSet.Station.COAL_HOPPER,
      ...GOOD_TRAIN_STATIONS.sort(({ value: a }, { value: b }) => b() - a()).map(
        ({ piece }) => piece,
      ),
      TrainSet.Station.TOWER_FIZZY,
      TrainSet.Station.VIEWING_PLATFORM,
    ] as TrainSet.Cycle;
    trainCycle = cycle;
  }
  return [...trainCycle];
}

function valueStation(station: TrainSet.Station): number {
  if (station === TrainSet.Station.COAL_HOPPER) {
    return valueStation(getBestCycle()[1]);
  }
  return GOOD_TRAIN_STATIONS.find(({ piece }) => piece === station)?.value() ?? 0;
}

function valueOffset(offset: number): number {
  const firstFortyTurns = 5 * sum(getBestCycle(), valueStation);
  const extraTurns = sum(getBestCycle().slice(0, offset - 1), valueStation);
  return (firstFortyTurns + extraTurns) / (40 + offset);
}

let bestOffset: number | null = null;
function getBestOffset(): number {
  return (bestOffset ??= maxBy([2, 3, 4, 5, 6, 7, 8], valueOffset));
}

export function getPrioritizedStations(): TrainSet.Station[] {
  return getBestCycle().slice(0, getBestOffset() - 1);
}

function getRotatedCycle(): TrainSet.Cycle {
  const offset = get("trainsetPosition") % 8;
  const newPieces: TrainSet.Station[] = [];
  const defaultPieces = getBestCycle();
  for (let i = 0; i < 8; i++) {
    const newPos = (i + offset) % 8;
    newPieces[newPos] = defaultPieces[i];
  }
  return newPieces as TrainSet.Cycle;
}

export function rotateToOptimalCycle(): boolean {
  return TrainSet.setConfiguration(getRotatedCycle());
}

export function grabMedicine(): void {
  const options = visitUrl("campground.php?action=workshed");
  let i = 0;
  let match;
  const regexp = /descitem\((\d+)\)/g;
  const itemChoices = new Map<Item, number>();
  if (!globalOptions.nobarf) {
    // if spending turns at barf, we probably will be able to get an extro so always consider it
    itemChoices.set($item`Extrovermectin™`, -1);
  }

  while ((match = regexp.exec(options)) !== null) {
    i++;
    const item = descToItem(match[1]);
    itemChoices.set(item, i);
  }

  const bestItem = maxBy([...itemChoices.keys()], garboValue);
  const bestChoice = itemChoices.get(bestItem);
  if (bestChoice && bestChoice > 0) {
    visitUrl("campground.php?action=workshed");
    runChoice(bestChoice);
  }
  if (handlingChoice()) visitUrl("main.php");
}
